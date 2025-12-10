import { module as jestModule } from '@jest/globals';

jestModule.run = jestModule.run || (() => Promise.resolve());

export {};
