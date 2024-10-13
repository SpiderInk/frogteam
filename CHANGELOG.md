# Change Log

All notable changes to the "frogteam" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## 0.1.6
- Better event handling for saving prompts and setups
- Wrapper prompt for dall-e-3
- Additional lead-architect prompt

## 0.1.5
- Enable using dall-e-3 to define a graphic artist

## 0.1.1
- mlFLow experiments for tracking prompts
- mlFLow config in .vscode/frogteam/config.json
- moved frogteam files to .vscode/frogteam/
- Fixed projects.jsonb file
- Gave answer tab state

## 0.1.0
- mlFLow experiments early setup mlFlow only work from localhost:5001
- Fixed webview post message events
- updated member and prompt tree items

## 0.0.19
- Bug Fix: task-summary type missing
- Bug Fix: Duplicate and Delete buttons we erring
- Updated included prompts

## 0.0.18
- Project level at the top of the history tree
    - Project tracked in history entry
- Multi-Root Workspace Compatibility
- Task a member directly from their configuration page
- CSS and JS Webview consolidation
- Proper content security policies

## 0.0.17
- Commands - a top level menu entry
- History hierarchy Changes 
    - Toggle History Grouping (See "Commands")
    - Parent/Child elements but a flat tree
- Respond to Answers directly
    - In the History's Answer panel when the response is Markdown there is a "Respond Here" button
    - When using this feature relevant immediate history will be included in the new LLM interaction
- The Builder now collects a project name and directory

## 0.0.16
- Azure OpenAI  
- Upgrade Axios due to vulnerability report

## 0.0.15
- Tagging History Entries
- Updated History Display

## 0.0.14
- New prompt for requesting task/project summary
- Wildcard prompts
- import new prompts
- API Key from Environment Variable

## 0.0.13
Moving to GitHub Team: https://github.com/SpiderInk/frogteam

## 0.0.12
- Added Running Status Indicator in the StatusBar says "Frogteam" when its a project run and "Teammeber" when its a directed run.
- Added an Output Channel called "FrogTeam.ai" that updates with every history entry and on other events.
- Added New Member and Prompt commands to the project view.
- Added Error message to tell yu when a team member has no aligned system prompt.
## 0.0.11
- lead-architect now supports Bedrock

## 0.0.10
- Add region for AWS Bedrock

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