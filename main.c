#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>
#include <windows.h>
#include <signal.h>
#include <dir.h>
#include <modbus.h>

#define DEFAULT_POLL_INTERVAL_MS 1000

#define NB 5

#define CON_TYPE_TCP 0x01
#define CON_TYPE_RTU 0x02

static volatile sig_atomic_t keep_running = 1;

static char *get_timef(char *format, size_t maxsize) {
  char *str = malloc(sizeof(char) * maxsize);
  time_t system_time = time(NULL);
  struct tm* time = localtime(&system_time);
  strftime(str, maxsize, format, time);
  return str;
}

int get_file_size(FILE *fp) {
	fseek(fp, 0, SEEK_END);
	int size = ftell(fp);
	fseek(fp, 0, SEEK_SET);
	return size;
}

static char *app_get_setting_val(char *key) {
  FILE *fp = NULL;
  char content[1024];
  char *value = malloc(sizeof(char) * 128);
  bool is_exist = false;

  if ((fp = fopen("settings.conf", "r")) == NULL) {
	 perror("Failed open configuration file");
	 exit(EXIT_FAILURE);
  }

  /* read file to content */
  int c = fread(content, sizeof(char), 1024, fp);
  content[c] = '\0';
  fclose(fp);

  /* extract value by key */
  char *input = strtok(content, "=\n");
  while(input != NULL) {
	  if (is_exist) {
		  strcpy(value, input);
		  break;
	  }
	  if (strcmp(input, key) == 0)
		is_exist = true;

	  input = strtok(NULL, "=\n");
  }

  if (!is_exist) {
    free(value);
    return NULL;
  }

  return value;
}

uint8_t app_check_con_type(char *type) {
	if (strcmp(type, "TCP") == 0) return CON_TYPE_TCP;
	if (strcmp(type, "RTU") == 0) return CON_TYPE_RTU;
	return 0;
}

modbus_t *app_create_connection(char *type) {
	modbus_t *ctx;

	switch(app_check_con_type(type)) {
	  case CON_TYPE_TCP:
		{
		  char *IP = app_get_setting_val("IP");
		  char *PORT = app_get_setting_val("PORT");
		  puts("Creating TCP Modbus connection.");
		  ctx = modbus_new_tcp(IP, atoi(PORT));
		}
		break;
	  case CON_TYPE_RTU:
		{
		  char *PATH = app_get_setting_val("RTU_PATH");
		  char *BAUD = app_get_setting_val("RTU_BAUD");
		  char *PARITY = app_get_setting_val("RTU_PARITY");
		  char *DATA_BITS = app_get_setting_val("RTU_DATA_BITS");
		  char *STOP_BITS = app_get_setting_val("RTU_STOP_BITS");
		  puts("Creating RTU Modbus connection.");
		  ctx = modbus_new_rtu(PATH, atoi(BAUD), *PARITY, atoi(DATA_BITS), atoi(STOP_BITS));
		}
		break;
	  default:
	    fprintf(stderr, "Connection type can be \"TCP\" or \"RTU\".");
		exit(EXIT_FAILURE);
		break;
	}

	if (ctx == NULL) {
	  fprintf(stderr, "Unable to create the libmodbus context\n");
	  exit(EXIT_FAILURE);
	}

	if (modbus_connect(ctx) == -1) {
	  perror("Connection error");
	  modbus_free(ctx);
	  getchar();
	  exit(EXIT_FAILURE);
	}

	return ctx;
}

static void app_sig_handler(int sig) {
  keep_running = 0;
  exit(EXIT_SUCCESS);
}

char **strsplit(char *input, const char *delimiter, size_t *count) {
	if (!input || !delimiter) return NULL;

	char *tmp = input;
	size_t size = 0;

	while (*tmp != '\0') {
		if (*(tmp + 1) == '\0' && *tmp != *delimiter) {
			size++;
			break;
		}
		if (*tmp == *delimiter)
			size++;
		tmp++;
	}

	*count = size;

	char **result = malloc(sizeof(char*) * size);
	if (result) {
		size_t idx = 0;
		char *token = strtok(input, delimiter);
		while (token) {
			*(result + idx++) = strdup(token);
			token = strtok(NULL, delimiter);
		}
	}
	return result;
}

void putchar_many(char c, unsigned int count) {
  while(count--) putchar(c);
}

int main(void) {
  FILE *fp = NULL;
  bool is_stdout_log_enabled = 0;
  uint16_t tab_reg[NB] = {0};
  uint16_t tab_reg_len = (sizeof(tab_reg) / sizeof(uint16_t));

  char *con_type = app_get_setting_val("CONNECTION_TYPE");
  char *poll_interval = app_get_setting_val("POLL_INTERVAL_MS");
  char *enable_stdout_log = app_get_setting_val("ENABLE_STDOUT_LOG");
  char *base_logger_dir = app_get_setting_val("LOGGER_DIR");

  size_t slaves_count = 0;
  char **slave_ids_str = strsplit(app_get_setting_val("SLAVE_IDS"), ",", &slaves_count);
  unsigned int *slave_ids = malloc(sizeof(unsigned int) * slaves_count);
  unsigned int selected_slave_idx = 0;
  unsigned int i = slaves_count;
  while (i--)
    slave_ids[i] = atoi(slave_ids_str[i]);

  free(slave_ids_str);

  signal(SIGINT, app_sig_handler);

  if (con_type == NULL || base_logger_dir == NULL) {
    fprintf(stderr, "The \"CONNECTION_TYPE\" or \"LOGGER_DIR\" is undefined.");
    exit(EXIT_FAILURE);
  }

  if (enable_stdout_log != NULL) {
    is_stdout_log_enabled = atoi(enable_stdout_log);
  }

  modbus_t *ctx = app_create_connection(con_type);

  puts("Successfully connected.");

  modbus_set_slave(ctx, slave_ids[selected_slave_idx]);

  init_dir: ;
  char *writing_date = get_timef("%Y-%d-%m", 11);
  char *current_writer_dir = malloc(sizeof(char) * 256);

  snprintf(current_writer_dir, 256, "%s\\%s", base_logger_dir, writing_date);
  _mkdir(current_writer_dir);

  char *logger_path = strcat(current_writer_dir, "\\log.csv");

  if ((fp = fopen(logger_path, "a+")) == NULL) {
    perror("Cannot open file for logging");
    return EXIT_FAILURE;
  }

  while (keep_running) {
	char *time_str = get_timef("%Y-%d-%m %H:%M:%S", 20);
	char *date_str = malloc(sizeof(char) * 11);
	strncpy(date_str, time_str, 10);

	/* update writing folder */
	if (strcmp(date_str, writing_date) != 0) {
		fclose(fp);
		free(current_writer_dir);
		free(logger_path);
		free(writing_date);
		modbus_flush(ctx);
		goto init_dir;
	}

	int response = modbus_read_registers(ctx, 0, NB, tab_reg);

  /*if (response == -1) {
	    fprintf(stderr, "%s\n", "Error while reading registers");
	    Sleep(500);
	    continue;
	}*/

	// csv header
	int f_size = get_file_size(fp);
	if (f_size <= 0) {
		fputs("DATE,SLAVE_ID,", fp);
		for (uint16_t i = 0; i < tab_reg_len; i++) {
			fprintf(fp, "REG%d", i+1);
			if (i != tab_reg_len - 1)
				putc(',', fp);
		}
		fputc('\n', fp);
	}

	/* date and slave_id */
	fprintf(fp, "%s,%d,", time_str, slave_ids[selected_slave_idx]);

	if (is_stdout_log_enabled) {
    system("cls");
		printf("Log directory: %s\n", logger_path);
    printf("Time: %s\n", time_str);
    printf("Filesize: %d\n", f_size);
		puts("Registers type: Holding");
		printf("Slaves count: %d\n", slaves_count);
		printf("Data");
	}

	uint16_t i = 0;
	while (i < tab_reg_len) {
	  if (is_stdout_log_enabled)
	    printf("\tREG%d: %d\n", i + 1, tab_reg[i]);

	  fprintf(fp, "%d", tab_reg[i]);

	  if (i != tab_reg_len - 1)
	    putc(',', fp);
	  i++;
	}

	if (is_stdout_log_enabled) putchar_many('=', 65);

	free(time_str);
	free(date_str);

	putc('\n', fp);
	if (is_stdout_log_enabled) putchar('\n');
	Sleep(poll_interval != NULL ? atoi(poll_interval) : DEFAULT_POLL_INTERVAL_MS);
  }

  puts("Stopped by signal SIGINT");
  fclose(fp);
  modbus_close(ctx);
  modbus_free(ctx);

  return EXIT_SUCCESS;
}
