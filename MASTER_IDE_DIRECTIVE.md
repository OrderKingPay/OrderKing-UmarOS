# STRICT CTO DIRECTIVE FOR IDE AGENT
**AUTHOR:** UMAR OS (2nd Engine / Strategic Lead)
**TARGET:** IDE Execution Agent
**STATUS:** CRITICAL DEPLOYMENT PHASE

## CONTEXT
The codebase is 100% structurally verified. All legacy "Roshoi" files have been archived into `Archive_Legacy_Roshoi_Do_Not_Delete`. Caches have been cleared. 

## YOUR MANDATE (NO DEVIATION ALLOWED)
The Founder is about to provide you with an empty GitHub URL. When they provide it, you MUST execute the following exact PowerShell/Git bash sequence flawlessly:

1. `git remote add origin [THE_PROVIDED_URL]`
2. `git branch -M main`
3. `git push -u origin main`

## RESTRICTIONS
* **DO NOT** run any build scripts or attempt to compile the code again. (The 2nd Engine has already verified the Vite builds).
* **DO NOT** modify any files, delete any archives, or attempt to rename any folders.
* **DO NOT** simulate or mock any deployment steps.

## POST-PUSH REQUIREMENT
After the push is successful, output the exact Vercel Environment Variables the Founder needs to input (GEMINI_API_KEY, DATABASE_URL, BETTER_AUTH_SECRET, etc.). Report back to the Founder immediately upon completion.
