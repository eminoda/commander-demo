var program = require('commander')
var inquirer = require('inquirer');
var chalk = require('chalk')
var pkg = require('../package')
var cliName = 'c-cli'
var fs = require('fs')
var path = require('path')
var ejs = require('ejs')

function loadTemplate (name, data) {
    var contents = fs.readFileSync(path.join(__dirname, '..', 'templates', (name + '.ejs')), 'utf-8')

    function render () {
        return ejs.render(contents, data, {
        })
    }

    return { render }
}

// https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli/bin/vue.js#L219
var enhanceErrorMessages = (methodName, log) => {
    program.Command.prototype[methodName] = function (...args) {
        if (methodName === 'unknownOption' && this._allowUnknownOption) {
            return
        }
        this.outputHelp()
        console.log(`  ` + chalk.red(log(...args)))
        console.log()
        process.exit(1)
    }
}

enhanceErrorMessages('missingArgument', argName => {
    return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', optionName => {
    return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
    return `Missing required argument for option ${chalk.yellow(option.flags)}` + (
        flag ? `, got ${chalk.yellow(flag)}` : ``
    )
})

var projectConfig = {
    appName: '',
    middleware: {}
}
const questions = [{
    type: 'input',
    name: 'appName',
    message: "请输入应用名称",
    default () {
        return 'app';
    },
}, {
    type: 'confirm',
    name: 'redis',
    message: "是否需要集成redis",
}, {
    type: 'confirm',
    name: 'mysql',
    message: "是否需要集成mysql",
}, {
    type: 'checkbox',
    name: 'middleware',
    message: "请选择中间件",
    choices: [
        // new inquirer.Separator(' = 请求参数解析方式 = '),
        { name: 'express.json', checked: true, },
        { name: 'express.urlencoded', checked: false, },
    ]
}]

// 头命令
program
    .name(cliName)
    .version(pkg.version)
    .usage('<command> [options]')

program
    .command('add <plugin> [pluginOptions]')
    .description('install a plugin and invoke its generator in an already created project')
    .option('--registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
    .allowUnknownOption()
    .action((plugin) => {
        console.log(plugin)
    })

program
    .command('create')
    .description('创建应用')
    .allowUnknownOption()
    .action(() => {
        inquirer
            .prompt(questions)
            .then((answers) => {
                Object.getOwnPropertyNames(answers).map(key => {
                    projectConfig[key] = answers[key]
                    if (key == 'middleware') {
                        answers[key].forEach(m => {
                            projectConfig.middleware[m] = true
                        })
                    } else {
                        projectConfig[key] = answers[key]
                    }
                    const app = loadTemplate('app.js', projectConfig)
                    console.log(app.render())
                })

            })
            .catch((error) => {
                console.log(error)
                if (error.isTtyError) {
                    // Prompt couldn't be rendered in the current environment
                } else {
                    // Something else went wrong
                }
            });
    })

program.on('command:*', ([cmd]) => {
    console.log(123)
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    console.log()
    process.exitCode = 1
})

// 帮助 help
program.on('--help', () => {
    console.log()
    console.log(`  Run ${chalk.cyan(`${cliName} <command> --help`)} for detailed usage of given command.`)
    console.log()
})
program.commands.forEach(c => c.on('--help', () => console.log()))

// 解析命令行
program.parse(process.argv)

