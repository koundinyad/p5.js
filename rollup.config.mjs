import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { string } from 'rollup-plugin-string';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import pkg from './package.json' assert { type: 'json' };
import dayjs from 'dayjs';
import { visualizer } from "rollup-plugin-visualizer";

const plugins = [
  commonjs(),
  nodeResolve(),
  json(),
  string({
    include: 'src/webgl/shaders/**/*'
  })
];
const banner = `/*! p5.js v${pkg.version} ${dayjs().format('MMMM D, YYYY')} */`;

export default [
  {
    input: 'src/app.js',
    output: [
      {
        file: './lib/p5.rollup.js',
        format: 'iife',
        name: 'p5',
        banner
      },
      {
        file: './lib/p5.rollup.esm.js',
        format: 'esm',
        banner
      },
      {
        file: './lib/p5.rollup.min.js',
        format: 'iife',
        name: 'p5',
        banner,
        plugins: [terser({
          compress: {
            global_defs: {
              IS_MINIFIED: true
            }
          },
          format: {
            comments: false
          }
        })]
      }
    ],
    treeshake: {
      preset: 'smallest',
      // NOTE: remove after we stopped using side effects
      moduleSideEffects: true
    },
    plugins: [
      ...plugins,
      visualizer({
        filename: "analyzer/stats.html",
        gzipSize: true,
        brotliSize: true
      })
    ]
  },
  // NOTE: comment to NOT build standalone math module
  {
    input: 'src/math/index.js',
    output: [
      {
        file: './lib/p5.math.js',
        format: 'iife'
      },
      {
        file: './lib/p5.math.min.js',
        format: 'iife',
        plugins: [terser({
          compress: {
            global_defs: {
              IS_MINIFIED: true
            }
          },
          format: {
            comments: false
          }
        })]
      },
      {
        file: './lib/p5.math.esm.js',
        format: 'esm'
      }
    ],
    external: ['../core/main'],
    plugins: [
      ...plugins,
      visualizer({
        filename: "analyzer/stats.math.html",
        gzipSize: true,
        brotliSize: true
      })
    ]
  }
];
