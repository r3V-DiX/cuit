const fs = require('fs');
async function run() {
  const loginRes = await fetch("http://127.0.0.1:4001/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@employer.com", otp: "123456", firstName: "Test", lastName: "Employer", role: "EMPLOYER" })
  });
  const loginData = await loginRes.json();
  const cookies = loginRes.headers.getSetCookie();
  console.log("Cookies from login:", cookies);
  
  let csrfToken = "";
  let sessionToken = "";
  for (const c of cookies) {
    if (c.startsWith("csrf_token=")) csrfToken = c.split(";")[0].split("=")[1];
    if (c.startsWith("session_token=")) sessionToken = c.split(";")[0].split("=")[1];
  }
  console.log("Extracted CSRF:", csrfToken);
  
  const fd = new FormData();
  const blob = new Blob(["test"], { type: "text/plain" });
  fd.append("file", blob, "test.txt");
  
  const uploadRes = await fetch("http://127.0.0.1:4004/employer/company/logo", {
    method: "POST",
    headers: {
      "x-csrf-token": decodeURIComponent(csrfToken),
      "Cookie": `session_token=${sessionToken}; csrf_token=${csrfToken}`
    },
    body: fd
  });
  console.log("Upload response:", uploadRes.status);
  const uploadData = await uploadRes.text();
  console.log("Upload data:", uploadData);
}
run();
