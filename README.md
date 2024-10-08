# batchai - uses AI to batch processing project files

[![Latest Release]()

I frequently depends on ChatGPT and Github Copilot, but tired of 2 points:
1. Have to copy-and-paste between chat windows and opened file - why AI cannot change the file directly? My project files are in git control, easy to view diff and revert change, I don't worry introduction of unwanted changes.
2. Open code files repeatedly to ask AI to do something on them - why AI cannot do that batch?

So batchai is to a command line tool which uses AI to batch processing project codes in a git repository directory. By 'batch', it works on all project files in single command, no need to copy-paste between AI chat windows and opened code files, for example, uses AI to fix the code directly. The opinion behind batchai is, batchai only works in a git repository directory - rejected for a non-git repository directory, so that for all changes that batchai does we need to confirm those changes by ourselves as AI doens't works perfectly. 

## Features

- [x] Review - Report issues to console, saved as review report, fix the code directly

- [ ] Explain, comment generation, test generation, refactoring - still working on

- [x] Leverage AI agents to check cross-file code references instead of only aware of single-file codes 

- [x] Implemented using Go, so single executable binary, works on macOS, Linux and Windows.

- [x] Supports OpenAI-compatbiel LLM, including Ollama

## Installation

Installation can be done in two ways;

Download the executable binary (https://github.com/qiangyt/batchai/releases/) to $PATH.

  - Windows
    Download https://github.com/qiangyt/batchai/releases/download/v0.0.1/batchai.exe, copy it to your executable path

  - Linux

  ```shell
     sudo curl -L https://github.com/qiangyt/batchai/releases/download/v0.0.1/batchai.linux -o /usr/local/bin/batchai
     sudo chmod +x /usr/local/bin/batchai
  ```

  - Mac OSX (x86_64)

  ```shell
     sudo curl -L https://github.com/qiangyt/batchai/releases/download/v0.0.1/batchai.darwin_amd64 -o /usr/local/bin/batchai
     sudo chmod +x /usr/local/bin/batchai
  ```

  - Mac OSX (arm64)

  ```shell
     sudo curl -L https://github.com/qiangyt/batchai/releases/download/v0.0.1/batchai.darwin_arm64 -o /usr/local/bin/batchai
     sudo chmod +x /usr/local/bin/batchai

  Then type ```batchai```, following the help to have a try. Currently

### Configuration

  - Configuration files:

    - Global ${HOME}/batchai/batchai.yaml. It's optional, see [](https://) for a default one as reference.
    - Per-directory ${GIT_REPOSITORY_DIRECTORY}/.env, where we could configuration batchai by environment variables. See []() for a default one as reference.

  - Specifies the model:
     ${BATCHAI_REVIEW_MODEL} - openai/gpt-4o-mini by default

  - OpenAI
    ${OPENAI_API_KEY}, ${OPENAI_PROXY_URL}, ${OPENAI_BASE_URL}, etc.

  - Ali QWEN
    ${OPENAI_API_KEY}, ${QWEN_BASE_URL}, etc.

   - [Ollama](https://ollama.com/)
    ${OLLAMA_BASE_URL}, etc.
    See [docker-compose.yml]() for my example to run Ollama in docker
