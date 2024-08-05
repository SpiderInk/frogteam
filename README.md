# <img src="https://frogteam.ai/logo.png" alt="frogteam icon" width="32" height="32"> - frogteam 

<br>

Hi there - Thanks for stopping by. I decided to put this out there now. Its at a nice spot where there is some functionality. I am wondering if there is an appetite for what I am doing here. Here is a short demo <a href="https://youtu.be/hxatfrgiiAQ">video</a>.
<br><br>
Follow me on [instagram](https://www.instagram.com/reddoverises/).

## Your virtual GenAI Engineering Team

This is meant to be a generative AI interface where you can register new models, configure model settings and prompts, interface with [Chroma](https://www.trychroma.com/) embeddings and have a common set of commands you can use to interact with files in the workspace and the output from various LLMs. You register "team members" and assign them a model you can use the same model multiple times or use different models. You can assign team members to collaborate on a task and give them a maximum time or token size.  

Planned UI Interactions
- Chat
- Add/Removed/Edit Team member
    - Name
    - Model
    - Limits
- Prompt Library
    - This should be linked to a git repo where new prompts may become available
    - Default Set
    - Add/Remove/Edit
    - tags: model, purpose
Planned Commands
    - Add File
    - Edit File
    - Delete File
    - Move File
    - Vector Search
    - Chunk Content
        - type mappings
    - Generate and Store Embedding
    - @TeamMember

## Flow
You must define at least three members
    - lead-architect
    - lead-engineer
    - developer

**At present the lead-architect must use an OpenAI GPT Model** this will be configurable in a future version just like any other team member. 

**Project**
Describe what the project is. Be specific and supply any information you may have. Code snippets, class hierarchy suggestions, research and example references. Web Site references for libraries you want to use, etc...
**When you press GO**

**Project Manager**
The automated project manager breaks down the project and
- Provides each Member with an assignment

Each member works to completion on their assignment
    - When the task completes the information is added to the messages
When all members have performed their tasks the lead architect gets a final pass and summarizes the work that was done.

You can refine the prompt and submit again. Existing files will be used and edited.

**Chat**
You can directly request that a team member perform a task. This is nice if you like what has been done and now have follow up work that a member can do for you.


## Known Issues/Limitations

- At present this will only work directly with OpenAI or AWs Bedrock
    - For OpenAI you need an API Key
    - For AWS Bedrock you need to be logged into AWS in you VS Code Environment and you need the supported models deployed
- Documentation is weak, I am working on it.
- No tool call validation so sometimes initial project generation never completes you can try again
    - validation/retry is coming
- Validation of Team Members to prompts, for now use Team Lineup view to manually validate. If you see: TypeError: Cannot read properties of undefined (reading 'content') this is the issue.
- If you paste into the prompt text area UI formatting may not work, it will save so just close and open the editor window for now.

## Release Notes

## 0.0.9
Marketplace categorization and copy updates

## 0.0.8
- Icon change

### 0.0.7
- Icon change
- Copy updates in Prompt and Project views
- Setting all default prompts to active

### 0.0.6 (and older)
This is an early version give it try. The following is what you can do.
- Add Team Members and make sure they align with a prompt
    - You can use openai with API Keys
    - You can use Amazon Bedrock if your environment is logged in
- You will get validation error messages if you don't have the minimum members/prompts
- You can use the Team Lineup to validate Member/Prompt alignment
- You can use the Builder to kick off the initial project creation
- You can use the Builder to ask a specific team member perform a specific task
    - You can say @membername can you edit the index.html file and change the title to "Narwhal"

## Tasks/Roadmap
- Sync README prompts and resources/prompts.json
- Prompt Validation should also show an error in the Team Configuration when a member does not align with a prompt
- Can the "new Prompt" and "New Setup" Buttons stay visible
    - **No** not in this tree view
    - maybe make them Commands in the Project panel for visibility
 - Add a Status Bar indicator
    - add an indicator that something is happening/running
    - There needs to be a status bar/activity bar/Project Panel indicator that tasks are running

- BUG: sometimes toolCall definitions or results are bad and the process errors out
- BUG: paste into prompt breaks HTML view until close/re-open (of that view) (data is saved correctly)
- BUG: function call history seems to list number of characters as arguments make this more meaningful
- MESS: generateUniqueId() in WebView HTML files needs consolidation
- MESS: CSS in WebView HTML files needs consolidation

- make standard commands to start a project and save the project file as a state file for the User Prompt

- Implementing Other Model Sources
    - start by only abstracting queueMemberAssignment this means that the lead-architect will only work with openai models
        - Langchain has been started and allows a team member to be attached to a Bedrock model **in testing**
        - bedrock boto3
            - LLAMA
        - hugging face
        - bedrock gateway?
        - azure?

- set up a queue to process requests from
    - only process one item at a time

- git integration
    - stash first
    - new branch first
    - PR generation

- configuration for a time or token limit by model/team member
    - this will require tracking
    - the lead architect will need to be aware of these constrains when giving out assignments

- create a tool that allows any team member (including lead architect) to ask a question directed at the human
    - this can present in the history but will cause the entire task thread to wait
        - Document should open with the question on display
        - when clicked on in History document will open 
        - Document has the state of the chain allowing the human to answer and resume the chain

## What's Next?
- prompt library sharing platform
- mlflow experiment tracking
- add chromadb instance (optionally?)
    - URL/Internet or local disc content
    - file type based
- implement chunking strategy for the solutions code base
- implement chunking strategy for the history
- implement chunking strategy for documentation
- implement search
- on demand web crawl that will chunk and store in local Chroma
- enable RAG on/off for generation
- In History
    - an icon for content vs function response 
        - indicate success/fail (green checkmark vs red X)
        - can we indicate when there is file content and when there isn't (is there a conflict with markdown?)
        - sometimes a file wasn't created yet and that is ok
- Starting with Python 
    - automated/isolated test environment where team members can test code generations and collaborate on solutions
    - When hunan interaction is needed the chat interface will be invoked asynchronously
        - if other tasks can continue they will

**DONE**
- Provide default prompts on first startup **done**
- Massive Migration from POC Project Task left
    - Change the entire UI to use three tree view tabs **done**
    - items in the tree view will just open in the editor **done**

    - Save Team Configs **done**
        - Need to add an ID that will not change **done**

    - Delete Prompt **done**
    - Delete Team Member **done**
    - Duplicate Prompt **done**
    - Duplicate Team Member **done**
    
    - Display Issues (Validate the required prompts and team members are created)
        - Just Display on Builder Panel **done**
        - Show Status indicator in Project View on Builder link **done**

    - Add New Prompt **done**
    - Add New Team Member **done**
    - History needs to auto refresh as new items are added **done**
- new icon **done**
- Add Prompt/Setup (**done**)
    - needs to make a new empty record every time (**done**)
    - place button on top of panel (**done**)
- Add a tag field to the prompts to make it easy to label inactive ones for tracking (**done**)
- add an active field so that prompts can be swapped around (**done**)
- implement directed commands (**done**)
    - @teammember - modify index.js add a new function to... (**done**)
- always send in an existing file map in from the main system prompt (**done**)
- Highlight History entries that have Markdown responses (**done**)
- use prompts from the library (**done**)
- implement prompts interface (**done**)
- required: (**done**)
    lead-architect, system
    lead-engineer, system
    developer, system
- validate that these prompts exist (**done**)
1. Make Role "readonnly" for now its always "system" (**done**)
2. lead-architect, lead-engineer, developer (as a dropdown) (**done**)
3. Disable project go (and chat/enhance feature later) when the lineup is incomplete (**done**)
4. Show the Team Roster on the project page and if any needed categories are missing list them in red (**done**)
- In History, color for each user (**done**)
- verification before delete
    - setups (**done**)
    - prompts (**done**)
- enable edit of loaded item (**done**)
- log all conversations in a tree and make sure the team members or admin process is labelled with it (**done**)
    - not working great - answers not always logged (**done**)
- BUG: use the lead-architect and project-manager from "setups" (**done**)

## Some Quick Prompts

Write me a simple web page that uses a canvas to draw a ball a start it bouncing around the boundaries of the canvas. Please break the project up into multiple files: index.html, index.js and index.css. This is only the starting point for the project so keep in mind we will be asking for refinements.

Write me a simple web page that uses a canvas to draw a small bird with flapping wings that flies the boundaries of the canvas.

Write me a simple web page that uses a small canvas say 100x100 pixels to draw a small bird with flapping wings. It needs to look like a bird. Make a special assignment about drawing the bird on the canvas and making the wings move.

## My Icons either came from the list below, I made them, or GenAI Helped me make them
- https://iconduck.com/sets/elementary-icon-set
- https://iconduck.com/sets/open-iconic-icon-set
- https://iconduck.com/sets/font-awesome-icons
- https://iconduck.com/sets/material-design-icons

## Prompt used to think about strategy, used a snippet for the validation
This is just an example of a prompt I used. I use gpt-4o to assist me as I created this extension.

```
OK. We need a way to guide the user to ensure they create three system prompts. We will start them with the required three:
1.    lead-architect, system
2.    lead-engineer, system
3.    developer, system
if they ever don't have these three we need to make clear they need to fix the situation. We will always need a "Roster" document that shows the team and the prompts they will use.
```

## These are the prompts currently provided as a starting point
```typescript
const PROMPTS = [
    {
        role: "system",
        content: "You are the lead architect on the project described by the user. You will break the project down into assignments and feed each team member the information to do their assignment. You will be provided with a list of team members and their focus areas and will output a prompt for each team member. This prompt explains their assignment. The user did not tell you this but assume you will need to start at the beginning. If they need AWS resources then scripts or terraform are needed to create them, if they need to install libraries like openai or pandas all of this needs to be included. The project needs to provide a full stack DevOps based solution. These are your Team Members: ${members}. Use the queue_member_assignment function provided in your tools to request each member perform their task. The lead engineer can be used to compile the work of the other members into a single solution. Make sure the artifacts each member creates are identified to the lead engineer. Assign a directory name for the project and instruct each team member to use this directory. They must check if files exist and edit those files if they do, create them if they do not. Here is the existing project file system: ${file_list}",
        category: "lead-architect",
        models: ["gpt-4o"]
    },
    {
        role: "system",
        content: "You are a member of a development team working in a Visual Studio Code environment.Your name is ${ name }. You have simple functions to open and create or overwrite files called save and getcontent.Use these function tools to implement a solution to the instructions in your user prompt.You will be given up to 2 minutes during which you can call the tools to read, create and update files, you will be given a directory to work in check the directory before writing a file, if the file is already there you should load and edit it.Use the getcontent tool to fetch the file.When calling save you can use { directory } /file.txt, for example. After two minutes we will stop sending tool results back. Your final response, explaining your work, will be sent to the lead architect. You can complete the task at any time by sending back an answer instead making a tool call. You will fail if you do not create files using the tools provided to implement a solution. Here is the existing project file system: ${file_list}",
        category: "developer",
        models: ["gpt-4o"]
    },
    {
        role: "system",
        content: "You are the lead engineer of a development team working in a Visual Studio Code environment.Your name is ${name}. You have simple functions to open and create or overwrite files called save and getcontent.Use these function tools to implement to complete the solution to the instructions in your user prompt.Your other team members have already gotten to work.You need to compile their work into a single solution and fill in any remain integration code or features that may be missing.You will be given up to 2 minutes during which you can call the tools to read, create and update files, you will be given a directory to work in.When calling save you can use { directory } /file.txt, for example. Never blinded overwrite a file use the getcontent tool first. After two minutes we will stop sending tool results back. Your final response, explaining your work, will be sent to the lead architect. You can complete the task at any time by sending back an answer instead of making a tool call. You will fail if you do not read and create files using the tools provided to implement a solution. Here is the existing project file system: ${file_list}",
        category: "lead-engineer",
        models: ["gpt-4o"]
    }
];
```
