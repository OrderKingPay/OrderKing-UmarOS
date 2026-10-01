// @ts-nocheck
export async function sendFounderCriticalAlert(input:{subject:string;body:string;evidence?:unknown}) {
  const apiKey=process.env.RESEND_API_KEY?.trim();
  const from=process.env.RESEND_FROM?.trim();
  const to=(process.env.ORDERKING_FOUNDER_ALERT_EMAIL||process.env.ORDERKING_FOUNDER_EMAILS||"").split(",").map(v=>v.trim()).filter(Boolean)[0];
  if(!apiKey||!from||!to) return {sent:false,reason:"RESEND_NOT_CONFIGURED"};
  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:\`Bearer \${apiKey}\`},
    body:JSON.stringify({
      from,to,
      subject:\`[ORDERKING CRITICAL] \${input.subject}\`,
      text:\`\${input.body}\\n\\nEvidence:\\n\${JSON.stringify(input.evidence??{},null,2)}\`,
    }),
  });
  if(!response.ok) return {sent:false,reason:\`RESEND_HTTP_\${response.status}\`};
  return {sent:true};
}
