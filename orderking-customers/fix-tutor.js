
const fs = require('fs');
const path = 'src/routes/tutor.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('bg-gradient-to-tr from-slate-950 via-[#0a0a0f] to-indigo-950 text-slate-50 backdrop-blur-3xl', 'bg-zinc-950 text-white');

content = content.replace('bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-3 shadow-inner', 'bg-zinc-900 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-3 border-b border-zinc-800');

content = content.replaceAll('bg-white/20 backdrop-blur-md border border-white/30', 'bg-zinc-950 border border-zinc-800');
content = content.replaceAll('hover:bg-white/30', 'hover:bg-zinc-800');
content = content.replaceAll('text-amber-50', 'text-zinc-400');
content = content.replaceAll('text-white font-black', 'text-white font-medium');
content = content.replaceAll('text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider', 'text-[9px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider border');

content = content.replace('bg-slate-900/50 backdrop-blur-xl border-y border-white/10 px-4 py-3 shadow-2xl z-10 flex flex-col gap-3', 'bg-zinc-950 border-b border-zinc-800 px-4 py-4 z-10 flex flex-col gap-4');

content = content.replace('<h1 className=\	ext-xl font-black text-amber-400 flex items-center gap-2\>', '<h1 className=\	ext-xl font-medium text-white flex items-center gap-2\>');
content = content.replace('AI Super-Tutor', 'Academic Intelligence');
content = content.replace('bg-emerald-100 text-emerald-700', 'bg-white text-black');
content = content.replace('100% Free', 'Unrestricted Access');
content = content.replace('text-indigo-600 size-6', 'text-white size-5');

content = content.replaceAll('bg-slate-800 border border-white/20 text-xs rounded-md p-2 font-medium text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500', 'bg-zinc-900 border border-zinc-800 text-xs rounded-md p-2 font-medium text-white outline-none focus:border-zinc-500');

content = content.replace('bg-white border-b border-slate-200', 'bg-zinc-950 border-b border-zinc-800');
content = content.replace('border-indigo-600 text-indigo-700', 'border-white text-white');
content = content.replace('border-transparent text-slate-500', 'border-transparent text-zinc-500');
content = content.replace('border-sky-600 text-sky-700', 'border-white text-white');
content = content.replace('border-emerald-600 text-emerald-700', 'border-white text-white');
content = content.replace('border-amber-500 text-amber-600', 'border-white text-white');

content = content.replace('Tutor', 'Intelligence');
content = content.replace('WFH Jobs', 'Placements');
content = content.replace('Govt Schemes', 'State Programs');
content = content.replace('Premium', 'Elite Status');

content = content.replace('Hello! I am your Free Super-Tutor. Select your Board and Class above, and ask me any syllabus question!', 'Academic Intelligence initialized. Please specify your curriculum parameters and submit your query.');
content = content.replace('Type your textbook question here...', 'Initialize academic query...');
content = content.replace('Step 1: Ask Question • Step 2: Learn Formula • Step 3: Score Max Marks', 'Secure Encrypted Connection • Verified Academic Data');
content = content.replace('text-slate-400 mt-2', 'text-zinc-500 mt-2');

content = content.replace('bg-indigo-600 text-white rounded-br-none', 'bg-white text-black rounded-br-none');
content = content.replace('bg-white border border-slate-200 text-amber-400 rounded-bl-none shadow-sm', 'bg-zinc-900 border border-zinc-800 text-white rounded-bl-none');
content = content.replace('bg-white border border-slate-200 rounded-2xl rounded-bl-none', 'bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-none');
content = content.replace('Teacher is thinking...', 'Processing intelligence...');
content = content.replace('text-indigo-600', 'text-white');

content = content.replace('bg-slate-100 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/50', 'bg-zinc-900 border border-zinc-800 rounded-xl p-1 focus-within:border-zinc-500');
content = content.replace('text-amber-400 placeholder:text-slate-400', 'text-white placeholder:text-zinc-500');
content = content.replace('bg-indigo-600 text-white p-2.5 rounded-lg', 'bg-white text-black p-2.5 rounded-lg');

content = content.replace('bg-sky-50 border border-sky-200', 'bg-zinc-900 border border-zinc-800');
content = content.replaceAll('text-sky-800', 'text-white');
content = content.replaceAll('text-sky-700', 'text-zinc-400');
content = content.replaceAll('text-sky-600', 'text-zinc-500');
content = content.replaceAll('bg-sky-600 text-white', 'bg-white text-black');

content = content.replace('bg-fuchsia-50 border border-fuchsia-200', 'bg-zinc-900 border border-zinc-800');
content = content.replaceAll('text-fuchsia-800', 'text-white');
content = content.replaceAll('text-fuchsia-700', 'text-zinc-400');
content = content.replaceAll('text-fuchsia-600', 'text-zinc-500');
content = content.replaceAll('bg-fuchsia-600 text-white', 'bg-white text-black');

content = content.replace('bg-teal-50 border border-teal-200', 'bg-zinc-900 border border-zinc-800');
content = content.replaceAll('text-teal-800', 'text-white');
content = content.replaceAll('text-teal-700', 'text-zinc-400');
content = content.replaceAll('text-teal-600', 'text-zinc-500');
content = content.replaceAll('bg-teal-600 text-white', 'bg-white text-black');

content = content.replace('bg-emerald-50 border border-emerald-200', 'bg-zinc-900 border border-zinc-800');
content = content.replaceAll('text-emerald-800', 'text-white');
content = content.replaceAll('text-emerald-700', 'text-zinc-400');
content = content.replaceAll('text-emerald-600', 'text-zinc-500');
content = content.replaceAll('bg-emerald-600 text-white', 'bg-white text-black');

content = content.replace('bg-blue-50 border border-blue-200', 'bg-zinc-900 border border-zinc-800');
content = content.replaceAll('text-blue-800', 'text-white');
content = content.replaceAll('text-blue-700', 'text-zinc-400');
content = content.replaceAll('text-blue-600', 'text-zinc-500');
content = content.replaceAll('bg-blue-600 text-white', 'bg-white text-black');

content = content.replace('bg-orange-50 border border-orange-200', 'bg-zinc-900 border border-zinc-800');
content = content.replaceAll('text-orange-800', 'text-white');
content = content.replaceAll('text-orange-700', 'text-zinc-400');
content = content.replaceAll('text-orange-600', 'text-zinc-500');
content = content.replaceAll('bg-orange-600 text-white', 'bg-white text-black');

content = content.replace('bg-purple-50 border border-purple-200', 'bg-zinc-900 border border-zinc-800');
content = content.replaceAll('text-purple-800', 'text-white');
content = content.replaceAll('text-purple-700', 'text-zinc-400');
content = content.replaceAll('text-purple-600', 'text-zinc-500');
content = content.replaceAll('bg-purple-600 text-white', 'bg-white text-black');

content = content.replaceAll('bg-slate-50 border border-slate-200', 'bg-zinc-900 border border-zinc-800');
content = content.replaceAll('text-slate-500', 'text-zinc-500');

content = content.replace('bg-gradient-to-br from-amber-500 to-orange-600', 'bg-zinc-900 border border-zinc-800');
content = content.replace('text-amber-100', 'text-zinc-400');
content = content.replace('text-orange-600 font-bold', 'text-black font-medium');

content = content.replace('bg-gradient-to-br from-indigo-600 to-blue-700', 'bg-zinc-900 border border-zinc-800');
content = content.replace('text-indigo-100', 'text-zinc-400');
content = content.replace('text-indigo-700 font-bold', 'text-black font-medium');

fs.writeFileSync(path, content);

