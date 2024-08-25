# <img src="https://frogteam.ai/logo.png" alt="frogteam icon" width="32" height="32"> - frogteam 

08-14-2024 Updates:
- Azure OpenAI
- Upgrade Axios due to vulnerability report
- Added some notes to the member setup panel

08-13-2024 Updates:

- Tagging History Entries
- Updated History Display

Next I am going to add a new tool allowing the LLM to query history as needed. I am also thinking about how to allow the LLM to query the user. If this tool is used the conversation would suspended until the user replies. This is a feature that user may want to turn off. I'd love to hear some feedback about this.

<br>
08-10-2024 Updates:

- Lead Architect can use all implemented models
- Added Running Status Indicator in the StatusBar says "Frogteam" when its a project run and "member-name" when its a directed run.
- Added an Output Channel called "FrogTeam.ai" that updates with every history entry and on other events.
- Added New Member and Prompt commands to the project view to make these actions more visible.
- Added Error message to tell yu when a team member has no aligned system prompt.
- New prompt for requesting task/project summary
- Wildcard prompts
- import new prompts
- API Key from Environment Variable

<br>
08-08-2024

Hi - Thanks for stopping by. I decided to put this out there. Its at a nice spot where there is some functionality. The idea is to create team members that are represented by a specific LLM. You can use a variety of different LLM's and overtime how members are selected and how assignments are made will evolve from the rudimentary state I have it in today. You can use AWS Bedrock models and OpenAI models and for now I will likely stay inside these boundaries for LLM selection:
    - The model supports tool calling 
    - The model and its tool calling feature are supported by langchain
I am currently focusing on some UI features while I enhance/refine my tool calling chain.  I hope soon to move on to a system prompt sharing feature and eventually I would like to integrate RAG with local vectors. I hope then to turn around and use my extension to develop my next mobile app, whatever that may be.

I am wondering if there is an appetite for what I am doing here. Let me know your thoughts.

Here is a short demo <a href="https://youtu.be/hxatfrgiiAQ">video</a>. <sub>lead-architect can use other models now</sub><br>
Follow me on [instagram](https://www.instagram.com/reddoverises/).<br>

- [ - frogteam](#---frogteam)
  - [Your virtual GenAI Development Team](#your-virtual-genai-development-team)
    - [Overview](#overview)
  - [Flow](#flow)
    - [Open the Builder](#open-the-builder)
  - [Known Issues/Limitations](#known-issueslimitations)
  - [Tasks - Implementing Other Model Sources](#tasks---implementing-other-model-sources)
  - [Tasks - On Deck](#tasks---on-deck)
  - [Tasks - Backlog](#tasks---backlog)
  - [Example User Prompt](#example-user-prompt)
  - [Icons](#icons)
  - [How to Contribute](#how-to-contribute)
  - [Submitting Issues](#submitting-issues)


## Your virtual GenAI Development Team

**This is my side project, my I like to write and generate code project.**<br><br>

This is meant to be a generative AI interface where you can register new models, configure model settings and prompts, interface with [Chroma](https://www.trychroma.com/) embeddings (eventually) and have a common set of commands you can use to interact with files in the workspace and the output from various LLMs. You register "team members" and assign them a model. You can use the same model multiple times or use different models. You can assign team members to collaborate on a task.  

### Overview
- Lead Architect assignment
    - The lead architect will break the project down and give other available members a task as it sees fit to the overall project.
        - After all the assignments are done the lead architect will take a look in order to
            - fix an issues it can
            - summarize the overall solution
- Single task assignments
    - You can @member a task
- Add/Remove/Edit Team member
    - Name
    - Model
    - Limits (not implemented)
- Prompt Library
    - This will eventually link to a git repo or an https endpoint where new prompts will become available
        - This is planned as a community sharing platform  
    - Default Set
    - Add/Remove/Edit
    - tags: model, purpose
Planned Commands
    - @TeamMember

## Flow
You must define at least three members
    - lead-architect
    - lead-engineer
    - developer

### Open the Builder
The "Builder" is found in the "Project" panel.

**Project Description**
Describe what the project is. Be specific and supply any information you may have. Code snippets, class hierarchy suggestions, research and example references. Web Site references for libraries you want to use, etc...
**When you press "Project GO"**

**Lead Architect**
The Lead Architect breaks down the project and
- Provides each Member with an assignment

Each member works to completion on their assignment
    - When the task completes the information is added to the messages
When all members have performed their tasks the lead architect gets a final pass and summarizes the work that was done.

You can refine the prompt and submit again. Existing files will be used and edited.

## Known Issues/Limitations
- At present this will only work directly with OpenAI or AWs Bedrock
    - For OpenAI you need an API Key
    - For AWS Bedrock you need to be logged into AWS in you VS Code Environment and you need the supported models deployed
    - OpenAI on Azure is implemented but I confess I have not tested it (**if someone tries it let me know**)
- Documentation is weak, I am working on it.
- No tool call validation so sometimes initial project generation never completes you can try again
    - validation/retry is coming
- It is hard to tell when the work is done
    - A status indicator is coming
- Validation of Team Members to prompts, for now use Team Lineup view to manually validate that all members are aligned with a system prompt. If you see: TypeError: Cannot read properties of undefined (reading 'content') this is likely the issue.
- If you paste into the prompt text area UI formatting may not work, it will save so just close and open the editor window for now.

## Tasks - Implementing Other Model Sources

- Right now I am chasing models that support tool calls using the Langchain framework
    - OpenAI from OpenAI
        - gpt-4o **done**
        - gpt-4-turbo **done**
        - gpt-35-turbo **done**
    - AWS Bedrock
        - Anthropic Claude 3.5 Sonnet **done**
        - Anthropic Cluade 2 Haiku **done**
    - OpenAI on Azure
        - gpt-4o **NEEDS TESTING**
        - gpt-4-turbo **NEEDS TESTING**
        - gpt-35-turbo **NEEDS TESTING**
    - HuggingFace
        - Is there a standard way I can do this. This is a research task for me.

## Tasks - On Deck
- **Now that we collect project name and directory** from the user in the Builder let's make a "Project" level at the top of the history tree
    - Add a special history entry for when a project is first created and only store the three properties there
        - name, directory, problem

- **Extract the response form out of the Answer Panel** 
    - Use in Team Member Setup Panel as well so we can do directed top level not history included tasks from there.
    - Look at the CSS MESS when solving this
    - configuration for a time or token limit by model/team member
        - implement team member token limits/time limits/request token limits
        - this will require tracking
        - the lead architect will need to be aware of these constrains when giving out assignments

- BUG: sometimes toolCall definitions or results are bad and the process errors out
    - Maybe just try catch and report/log/add history what happened? **done**
    - At this time the user can just try clicking "Go" again
- MESS: generateUniqueId() in WebView HTML files needs consolidation
    - can a WebView use <script> tags for local files?
- MESS: CSS in WebView HTML files needs consolidation
    - can a WebView use <style> tags for local files?

## Tasks - Backlog
- prompt library sharing platform
    - MLFlow experiment tracking
- add Chromadb instance (optionally?)
    - on demand web crawl that will chunk and store in local Chroma
    - URL/Internet or local disc content
    - file type based
    - implement chunking strategy for the solutions code base
    - implement chunking strategy for the history
    - implement chunking strategy for project documentation
    - implement search history/code search
- set up a queue to process requests from (so the user can queue up tasks while operations are ongoing)
    - only process one item at a time
- In History
    - an icon for content vs function response 
        - indicate success/fail (green checkmark vs red X)
        - can we indicate when there is file content and when there isn't (is there a conflict with markdown?)
        - sometimes a file wasn't created yet and that is ok
- Starting with Python 
    - automated/isolated test environment where team members can test code generations and collaborate on solutions
    - When hunan interaction is needed the chat interface will be invoked asynchronously
        - if other tasks can continue they will
- create a tool that allows any team member (including lead architect) to ask a question directed at the human
    - this can present in the history but will cause the entire task thread to wait
        - Document should open with the question on display
        - when clicked on in History document will open 
        - Document has the state of the chain allowing the human to answer and resume the chain
- git integration
    - stash first
    - new branch first
    - PR generation

## Example User Prompt

> Write me a simple web page that uses a canvas to draw a ball and start it bouncing around the boundaries of the canvas. Please break the project up into multiple files: index.html, index.js and index.css. Place the files in a directory called bounce-ball. This is only the starting point for the project so keep in mind we will be asking for refinements.

> Create me a single page app that show directions from where the web browser thinks its location is to the closest train station. 

## Icons
Any icons you see either came from the list below, I made them, or GenAI Helped me make them.

- https://iconduck.com/sets/elementary-icon-set
- https://iconduck.com/sets/open-iconic-icon-set
- https://iconduck.com/sets/font-awesome-icons
- https://iconduck.com/sets/material-design-icons

## How to Contribute

I appreciate your interest in contributing to this project. However, I currently do not accept direct contributions such as pull requests. Instead, I encourage you to submit issues if you find any bugs, have feature requests, or need help.

## Submitting Issues

To submit an issue, please use the [GitHub Issues](https://github.com/yourusername/your-repo/issues) feature. Describe your issue in detail, and I will address it as soon as possible.

Thank you for your understanding and support!