
1. Into
    Start talking on a Splash Screen
    - frogteam.ai - your virtual generative ai dev team
    - I created frogteam.ao out of a desire for an open developer centric IDE Platform that can allow code generation prompt sharing, a feature I hope to offer in the coming weeks. 
    - today I am going to provide a small amount of background information as I demo what frogteam.ai can do today.
    - I hope this can become a fun tool for serious dev teams, hobbyists and even (eventually) parent/child code generation playgrounds.

2. It will first open to 3 Panels
    - Starting at the bottom we have
        - Prompt Library
            - In its most simple definition a prompt, in Generative AI, is a specific instruction given to the AI with the expectation that a relevant and coherent response will be returned.
            - Frogteam.ai's Prompt Library are for what is reffered to as a "system" prompt used to frame the role we want this model to take when given a user prompt.
            - Today frogteam provides four "system" prompts to get you started watch for more and for the prompt sharing platform in the future.
            - Now let's take a a closer look at the "lead-architect" prompt (read it) and review a few variables: name, members, and file_list

        - Team Configuration
            - To define a team member you need to specify what LLM they will use.
            - What is a Large Language Model (an LLM)?
                - A Large Language Model is a type of artificial intelligence that can understand and generate human-like text based on the massive amounts of data it has been trained on. 
            - frogteam.ai's goal is to provide you the ability to have many LLM's at your finger tips where you write code
                - to facilitate this frogteam's approach is to allow you to treat model's as a virtual team members that you ask to perform tasks
            - Today we have limited support for some OpenAI Models and some models offered on AWS Bedrock but this is one area of development that will receive attention before others (watch for expanded AWS Bedrock, OpenAI and others in coming weeks.)
            
        - The Project Panel
            - Team Lineup - In this early release you will want to have a look and make sure each team member is aligned with a prompt you may get unexpected errors otherwise
            - History - As team members perform actions various events and pieces of information are logged to history, for now this is the only way you know what is happening in a future version we will have a status/activity indicator
            - Builder - Ok, lets take a look at the builder. This is where we put it all together.
                - "Project Description" - This is where you tell the lead-architect what you want to build. The more specific you are the better result you will get. If you want specific programming language, library or technology to be used say so.
                - "Project Go" - Button, You can press this button as often as you want. With proper prompting existing files are  considered. If this is a new project it will get started, if it is an existing project start in a fresh branch and see how things go.
                - "Directed Go" - You have to @callout a specific member when using this feature for instance, "@Michael please change the color of the background in index.html."

3. Read the entire prompt, then click "Project Go"
    - Start talking about Michael making assignments
    - Mention "M" for markdown and show them
    - Show them a the History popup item as well
    - Show/spend a moment on the final summary

4. Show the resulting ball bouncing web page
    - Go back and demo directed go
    - Watch the changes happen
    - Say thanks and mention a few coming features

5. Splash screen exit
        
