# <img src="https://frogteam.ai/logo.png" alt="frogteam icon" width="32" height="32"> - <a href="https://marketplace.visualstudio.com/items?itemName=SpiderInk.frogteam">FrogTeam.ai</a> 
Update v0.2.3: 12-08-2024<br>
<ul>
    <li>Change to anthropic.claude-3-5-haiku-20241022-v1:0</li>
</ul>
Update v0.2.1: 12-07-2024<br>
<ul>
    <li>Focus on Anthropic</li>
    <li>Full config out of the box for Bedrock hosted models defaulting to us-west-2</li>
    <li>Use stability.stable-image-core-v1:0 for graphic artist</li>
    <li>File locking fix</li>
    <li>Suppress useless error messages</li>
</ul>
Update v0.1.6: 10-13-2024<br>
<ul>
    <li>Better event handling for saving prompts and setups</li>
    <li>>Wrapper prompt for dall-e-3</li>
    <li>Additional lead-architect prompt</li>
</ul>
<br>
<br>
Update v0.1.5: 10-01-2024<br>
<ul>
    <li>Add a new Team Member and make them a Graphic Artist</li>
    <li>Choose the dall-e-3 model</li>
    <li>This is a new feature there is no validation and no instruction</li>
</ul>
<strong>Prompt Example for using a Graphic Artist</strong><br>
<i>I named my Graphic Artist Jenny. When I described what I wanted I also included the follow to explain Jenny's limitations and how I wanted the lead-architect to handle her assignments.</i><br>
<br>
Make sure to ask Jenny to make graphics. Jenny's instructions must be very specific. You can only ask her to make one graphic file at a time and you can only describe what you want her to make in the prompt. A prompt for Jenny should be short, for example: "make me a small icon file that looks like a frog." Jenny just returns the path to the file she made. You need to work around her limitations. As the lead-architect plan out what you need from Jenny first and then tell the others what to do with what you had Jenny create!<br>
<br>
<br>
Update v0.1.2: 09-08-2024<br>
<ul>
    <li>NEW TOOL: Code Search - If you want to make a change that can affect multiple files there is a new tool the LLM can use to search the code of the solution.</li>
    <li>Better tool call error handling</li>
</ul>

Update v0.1.1: 09-08-2024<br>
<ul>
    <li>mlFLow experiments for tracking prompts</li>
    <li>mlFLow config in .vscode/frogteam/config.json</li>
    <li>moved frogteam files to .vscode/frogteam/</li>
    <li>Fixed projects.jsonb file</li>
    <li>Gave answer tab state</li>
</ul>

Update v0.1.0: 09-07-2024<br>
<ul>
    <li>mlFLow experiments early setup mlFlow only work from localhost:5001</li>
    <li>Fixed webview post message events</li>
    <li>updated member and prompt tree items</li>
</ul>

Updates v0.0.19: 09-01-2024<br>
This release is for Bug Fixes. Delete and Clone buttons fixed. Missing prompt category fixed.<br>
Also Note: **Prompts can be assigned wildcard (*) for their model.**

Updates v0.0.18: 08-30-2024
Start looking to the change log for details. This is a big one for history reorganization. 

Updates v0.0.17: 08-25-2024
<ul>
    <li>Commands - a top level menu entry</li>
    <li>History hierarchy Changes 
        <ul>
            <li>Toggle History Grouping (See "Commands")</li>
            <li>Parent/Child elements but a flat tree</li>
            <ul>
                <li>This means that child elements appear under their parents and also in the root of the tree</li>
            </ul>
        </ul>
    </li>
    <li>Respond to Answers directly
        <ul>
            <li>In the History's Answer panel when the response is Markdown there is a "Respond Here" button</li>
            <li>When using this feature relevant immediate history will be included in the new LLM interaction</li>
        </ul>
    </li>
    <li>The Builder now collects a project name and directory
        <ul>
            <li>This information is used to format XML that is used in the prompt
            <li>This tells the LLM exactly what its getting</li>
            <li>System prompts will be adjusted in future versions</li>
            <li>The next version will use "Project Name" in the history hierarchy</li>
        </ul>
    </li>
</ul>

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

- [ - FrogTeam.ai](#---frogteamai)
  - [Your virtual GenAI Development Team](#your-virtual-genai-development-team)
    - [Overview](#overview)
  - [Flow](#flow)
    - [Open the Builder](#open-the-builder)
  - [MLFLow Integration](#mlflow-integration)
  - [Known Issues/Limitations](#known-issueslimitations)
  - [Tasks - Implementing Other Model Sources](#tasks---implementing-other-model-sources)
  - [Tasks - On Deck](#tasks---on-deck)
  - [Tasks - Backlog](#tasks---backlog)
  - [Example User Prompts](#example-user-prompts)
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

## MLFLow Integration
Very basic prompt and duration logging right now. I want to collect a set of solutions each one with a specific user provided project definition and then create an evaluation pipeline to grade system prompts against a set user prompts for each solution. I would like to get to a place where the community could contribute system prompts optimized for specific languages and technologies.  To submit a system prompt you would have to be able to pass an evaluation pipeline. It would be particularly cool to enable sharing of knowledge vectors/embeddings grounding a system prompt around a more specific context. Having MLFLow integrated here is experimental but I envision adding a Test tab where test data can be used and submitted and a submission tab where prompts can be submitted and tracked.

## Known Issues/Limitations
- Validation of Team Members to prompts, for now use Team Lineup view to manually validate that all members are aligned with a system prompt. If you see: TypeError: Cannot read properties of undefined (reading 'content') check the Lineup someone probably has no prompt.
- No tool call validation so sometimes initial project generation never completes--you can try again
    - validation/retry is coming
- At present this will only work directly with OpenAI or AWs Bedrock
    - For OpenAI you need an API Key
    - For AWS Bedrock you need to be logged into AWS in your VS Code Environment and you need the supported models deployed in the proper account/region 
    - OpenAI on Azure is implemented but I confess I have not tested it (**if someone tries it let me know**)

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
- Use structured output for the member assignment prompts or more parameters
  - We could output the list of skills needed and amend the system prompt
- You should be able to right click a file and choose "refactor with frogteam"
- Switch to pure Anthropic Claude and use the meta prompt
- Make a tool for the llm that does a code search, like just use vscode's search to find things in files enabling LLM find/replace **done**
- mlflow
    - experiment setup
      - You can start a new experiment and the experiment id will be saved with the prompt object **done**
      - places where the prompt is used runs will be created and the prompt, duration are logged **done**`
      - You can stop an experiment by clearing the experiment id **done**

- Enable hyper params (temp..)

**SYSTEM PROMPT** Sometimes a large file will just have a comment that says the rest remains unchanged leaving the user with git commands to fix it
    This next sentence need to be added to System Prompts.
    "Remember these are "live" solution files you have to output the entire file. Saying things like "the  rest of this code remains unchanged" causes the file to be incomplete. Do not do that."
        **FOR NOW I HAVE ADDED TO THE DESCRIPTION OF THE saveContentToFileApi TOOL**



- We need a way to export markdown more easily, user should be able to click a "Copy" icon to copy the Markdown response.
- Make a new tool that allows the llm to request the content of a URL be fetched, when its an image we should also base64 it
    - should this be for chunk/vectorize/RAG?



- Add try...catch/check for length where .content is used from llm response
- Add try...catch for tools calls and log failure in history **done**
- configuration for a time or token limit by model/team member
    - implement team member token limits/time limits/request token limits
    - this will require tracking
    - the lead architect will need to be aware of these constrains when giving out assignments
    - set temperature and other settings for the team member

- BUG: When asking a member to perform a task sometimes the summary is redundant.

- BUG: sometimes toolCall definitions or results are bad and the process errors out
    - Maybe just try catch and report/log/add history what happened? **done**
    - At this time the user can just try clicking "Go" again
    - An
    - 0y fix will need to address the conversation rules

## Tasks - Backlog
- Ask the Human tool - create a tool that allows any team member (including lead architect) to ask a question directed at the human
    - this can present in the history but will cause the entire task thread to wait
        - Document should open with the question on display
        - when clicked on in History document will open 
        - Document has the state of the chain allowing the human to answer and resume the chain
- git integration
    - commit first
      - branch first
      - commit
    - stash first
    - PR generation
- prompt library sharing platform - making more use of MLFlow
    - Make a data panels to house "golden" solutions to specific user requests
    - Make a pipeline to evaluate "system" prompts against the golden solutions
    - Make a prompt submission process
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

## Example User Prompts

> Write me a simple web page that uses a canvas to draw a ball and start it bouncing around the boundaries of the canvas. Please break the project up into multiple files: index.html, index.js and index.css. Place the files in a directory called bounce-ball. This is only the starting point for the project so keep in mind we will be asking for refinements.

> Create me a single page app that show directions from where the web browser thinks its location is to the closest train station. 

> Using openstreetmap web based mapping you will simulate tracking an air tag as it moves. 
from: Point A -> 1 Grey Rock Place, Stamford CT 
to: Point B -> Cove Island Park, Stamford, CT
- Do this by generating driving directions between these two locations and then show a dot moving along those directons over time
- Any files should be created/edited in the "tracking" directory
- I expect to be able to open index.html from the tracking directory using the LiveServer VS Code extension and when I do I expect to see a map showing the locations I have mentioned.

> Use an HTML Canvas to make a paddle tenis game where you can move a rectangle block back and forth using the left and right arrow keys. You hit the ball it goes up hits the top and comes back. If you miss and the ball hits the bottom wall you loose a point, if you hit the ball you gain 2 points.

> Write a puzzle game for html canvas. It should contain a selection of shapes that are cycling and when you click you lock in a shape, and when click a selected shape the shape rotates. After the user selects three shapes the shapes start falling down the canvas area. The user needs to get three shapes to lock together to form another shape before reaching the bottom, when two shapes are locked maybe the falling speed slows. The user does this by clicing the shapes to rotate them.

## Icons
Any icons you see either came from the list below, I made them, or GenAI Helped me make them. License files stored and distributed in the resources directory.

- https://iconduck.com/sets/elementary-icon-set
- https://iconduck.com/sets/open-iconic-icon-set
- https://iconduck.com/sets/font-awesome-icons
- https://iconduck.com/sets/material-design-icons

## How to Contribute

I appreciate your interest in contributing to this project. However, I currently do not accept direct contributions such as pull requests. Instead, I encourage you to submit issues if you find any bugs, have feature requests, or need help.

## Submitting Issues

To submit an issue, please use the [GitHub Issues](https://github.com/yourusername/your-repo/issues) feature. Describe your issue in detail, and I will address it as soon as possible.

Thank you for your understanding and support!