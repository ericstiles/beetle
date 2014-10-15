module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        complexity: {
            generic: {
                src: ['index.js', 'lib/**/*.js'],
                options: {
                    errorsOnly: false,
                    cyclometric: 6, // default is 3
                    halstead: 16, // default is 8
                    maintainability: 100, // default is 100,
                    hideComplexFunctions: false
                }
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                ignores: ['test/coverage/**/*.js', 'test/**/*.js']
            },
            files: {
                src: ['index.js', 'lib/**/*.js']
            },
            gruntfile: {
                src: 'Gruntfile.js'
            }
        },
        watch: {
            lint: {
                files: '<%= jshint.files.src %>',
                tasks: 'jshint'
            },
            test: {
                files: ['test/unit/*.js', 'index.js', 'lib/**/*.js'],
                tasks: 'coverage'
            }
        },
        concurrent: {
            target: {
                tasks: ['watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        mochaTest: {
            unit: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/unit/**/*.spec.js']
            }
        },
        env: {
            options: {
                //Shared Options Hash
            },
            dev: {
                NODE_ENV: 'development',
                LOG_LEVEL: 'debug',
            },
            test: {
                NODE_ENV: 'test',
                LOG_LEVEL: 'error'
            },
            build: {
                NODE_ENV: 'production',
                DEST: 'dist',
                extend: {
                    PATH: {
                        'value': 'node_modules/.bin',
                        'delimiter': ':'
                    }
                }
            },
            run: {
                NODE_ENV: 'production'
            },
            coverage: {
                NODE_ENV: 'test',
                APP_DIR_FOR_CODE_COVERAGE: '../test/coverage/instrument/',
                LOG_LEVEL: 'error'
            }
        },
        clean: {
            coverage: {
                src: ['test/coverage/']
            }
        },
        instrument: {
            files: ['index.js', 'lib/**/*.js'],
            options: {
                lazy: true,
                basePath: 'test/coverage/instrument/'
            }
        },
        storeCoverage: {
            options: {
                dir: 'test/coverage/reports'
            }
        },
        makeReport: {
            src: 'test/coverage/reports/**/*.json',
            options: {
                type: 'lcov',
                dir: 'test/coverage/reports',
                print: 'detail'
            }
        },
        execute: {
            target: {
                src: ['./index.js']
            }
        },
        open: {
            search: {

            },
            coverage: {

            }
        }
    });

    // plugins
    grunt.loadNpmTasks('grunt-complexity');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-istanbul');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-execute');

    // tasks
    grunt.registerTask('test', ['env:test', 'jshint', 'mochaTest:unit']);
    grunt.registerTask('coverage', ['jshint', 'clean', 'env:coverage',
        'instrument', 'mochaTest:unit', 'storeCoverage', 'makeReport'
    ]);
    grunt.registerTask('test2', ['env:test', 'mochaTest:unit']);
    grunt.registerTask('coverage2', ['clean', 'env:coverage',
        'instrument', 'mochaTest:unit', 'storeCoverage', 'makeReport'
    ]);
    grunt.registerTask('default', ['test', ]);
    //command line grunt to run search
    grunt.registerTask('search', function() {
        grunt.config('execute.options', {
            args: JSON.stringify(arguments)
        });
        return grunt.task.run([
            'env:run',
            'execute'
        ]);
    });
};
