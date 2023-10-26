export * from './object.js'

export const wait = (ms) => new Promise((res) => setTimeout(() => res(), ms));