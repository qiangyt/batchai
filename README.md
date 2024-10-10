# batchai - utilizes AI for batch processing of project codes

[![Latest Release]()

I often rely on ChatGPT and GitHub Copilot, but frustrated sometimes:

- Have to copy and paste between chat windows and my open files. Why can't AI update the files directly? My project files are under Git control, making it easy to view diffs and revert changes, so I'm not concerned about introducing unwanted modifications.
- Have to repeatedly open code files to ask AI for assistance with them. Why can't AI handle this in batches?
That's why I created BatchAI — a command-line tool that utilizes AI for batch processing of project code within a Git repository. With BatchAI, you can work on all project files with a single command, eliminating the need for copy-pasting between AI chat windows and your code files. For example, you can have AI fix code directly.

The philosophy behind BatchAI is simple: there's no need for copy-pasting anymore, as it operates solely within a Git repository directory and will reject attempts to run in non-Git repositories. This ensures that all changes made by BatchAI require our confirmation since AI is not infallible.

Currently, it only supports code review and fixing general issues (think of it as an AI-powered local SonarQube). I'm working on adding more features, including explanation and comment generation, text generation, and refactoring — all handled in batches.

I've been using it myself over the past few days, and here are my findings:

- It consistently identifies issues that traditional tools (like Sonarqube) might miss, saving me time in the process.
- It may not report all issues in one go, so I need to run it through several iterations.
- Due to outdated LLM training data and hallucinations, it's crucial to confirm the changes for accuracy by myself. That's why I make BatchAI work only on clean Git repository directories, making it easier to manage the changes.

Below is the positive cases:

- [Adds a check to ensure birthday not be in the future](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-7ba90c8df45063ea6569e3ea29850f6dbd777bc14f76b1115f556ade61441207)
<p align="center">
  <img src="doc/batchai-demo-1.png" width="800">
</p>

- [Renamed method to adhere to JavaBeans naming conventions](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-4788251011337c19f735f2061cf599b8dbc0394a92ba86447b0db9b386f869cd)
<p align="center">
  <img src="doc/batchai-demo-2.png" width="800">
</p>

And also wrong fix:

- [Downgraded MySQL version from 9.0 back to 8.0 as it think latest MySQL version is 8.0](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-b817f116541a3c3c50a563dac65d00a385635018b062ff6912bbe2aa12261bff)
<p align="center">
  <img src="doc/batchai-demo-3.png" width="800">
</p>

See [Demo cases](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712) for more cases

## Features

- [x] Review : Reports issues to the console, saves as a review report, and then fixes code directly.
- [x] Customized Prompts : Allows for tailored prompts based on user needs.
- [x] File Ignoring : Specifies files to ignore, respecting both .gitignore and an additional .batchai_ignore file.
- [x] Target Specification : Allows specifying target directories and files within the Git repository.
- [x] Built using Go: Resulting in a single executable binary that works on macOS, Linux, and Windows.
- [x] Colorized Diff : Displays colorized diffs in the console.
- [x] LLM Support : Supports OpenAI-compatible LLMs, including Ollama.
- [x] I18N : Supports internationalization comment/explaination generation.

## Planned features

- Explain, Comment Generation, Test Generation, Refactoring.
- Rejected Change Tracking : Tracks rejected changes to avoid redundant modifications.
- Language-Specific Prompts : Different prompts for various programming languages.
- LLM Usage Metrics : Implements metrics for tracking LLM usage.

## Getting Started

1. Download the latest executable binary from [here](https://github.com/qiangyt/batchai/releases/) and add it to your $PATH. For Linux and Mac OSX, remember to run `chmod +x ...` to make the binary executable.

2. Clone the demo project. The following steps assume the cloned project directory is `/data/spring-petclinic`

   ```shell
   git clone https://github.com/spring-projects/spring-petclinic
   cd /data/spring-petclinic
   ```

   In this directory, create a .env file. In the .env file, set the OPENAI_API_KEY. Below is an example:
  
   ```shell
   # OpenAI
   OPENAI_API_KEY=change-it
   #OPENAI_PROXY_URL=
   #OPENAI_PROXY_USER=
   #OPENAI_PROXY_PASS=
   #BATCHAI_REVIEW_MODEL=openai/gpt-4o-mini

   # Ali TONGYI qwen
   #QWEN_API_KEY=change-it
   #BATCHAI_REVIEW_MODEL=tongyi/qwen2.5-coder-7b-instruct

   # local Ollama
   #OLLAMA_BASE_URL=http://localhost:11434/v1/
   #BATCHAI_REVIEW_MODEL=ollama/qwen2.5-coder:7b-instruct-fp16
   ```

   For Ollama, you can refer to my example [docker-compose.yml](./docker-compose.yml)

3. CLI Examples:

   - Report issues to the console (also saved to `build/batchai`):

   ```shell
   cd /data/spring-petclinic
   batchai review . src/main/java/org/springframework/samples/petclinic/vet/Vets.java
   ```

   - Directly fix the target files:

   ```shell
   cd /data/spring-petclinic
   batchai review . src/main/java/org/springframework/samples/petclinic/vet/Vets.java
   ```

   - Run `batchai` in main Java code only:

   ```shell
   cd /data/spring-petclinic
   batchai review . src/main/java/
   ```

   - Run `batchai` on the entire project:

   ```shell
   cd /data/spring-petclinic
   batchai review .
   ```

## CLI Usage

- To view the global help menu and available commands, run:

  ```shell
  batchai -h
  ```

  ```shell
  NAME:
  batchai - utilizes AI for batch processing of project codes

  USAGE:
    batchai [global options] command [command options] <repository directory>  [target files/directories in the repository]

  VERSION:
    0.1.0 (5eeb081)

  COMMANDS:
    review           Report issues to console, also saved to 'build/batchai'
    list             Lists files to process
    explain (TODO)   Explains the code, output result to console or as comment
    comment (TODO)   Comments the code
    refactor (TODO)  Refactors the code
    help, h          Shows a list of commands or help for one command

  GLOBAL OPTIONS:
    --enable-symbol-reference  Enables symbol collection to examine code references across the entire project (default: false)
    --lang value, -l value     language for generated text (default: en_US.UTF-8) [$LANG]
    --help, -h                 show help
    --version, -v              print the version
  ```

- To see detailed help for the `review` command, run:

  ```shell
  batchai review -h
  ```

  ```shell
  NAME:
    batchai review - Report issues to console, also saved to 'build/batchai'

  USAGE:
    batchai review [command options]

  OPTIONS:
    --fix, -f   Replaces the target files (default: false)
    --force     Ignores the cache (default: false)
    --help, -h  show help
  ```

## Supported LLMs

Tested and supported models:

- OpenAI series: 
  
  - `openai/gpt-4o`
  
  - `openai/gpt-4o-mini`

  Other should work too.

- Ali TONYI Qwen series: 
  
  - `qwen2.5-coder-7b-instruct` (also available via Ollama.)

Other should work too.
  
To add more LLMs, simply follow the configuration in [res/static/batchai.yaml](res/static/batchai.yaml), as long as the LLM exposes an OpenAI-compatible API.

## Configuration

- Optional configuration file:

You can provide an optional configuration file at `${HOME}/batchai/batchai.yaml`. For a full example, refer to [res/static/batchai.yaml](res/static/batchai.yaml)

- Environment file:

You can also configure BatchAI via an environment file `.env` located in the target Git repository directory. Refer to [res/static/batchai.yaml](res/static/batchai.yaml) for all available environment variables, and [res/static/batchai.env](res/static/batchai.env) for their default values.

## License

MIT
