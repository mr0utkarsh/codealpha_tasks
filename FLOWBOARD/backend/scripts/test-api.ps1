# FLOWBOARD end-to-end API test. Run: powershell -File scripts/test-api.ps1
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5001/api'
$script:pass = 0; $script:fail = 0

function Check($name, $condition, $detail = '') {
  if ($condition) { Write-Host "PASS  $name" -ForegroundColor Green; $script:pass++ }
  else { Write-Host "FAIL  $name  $detail" -ForegroundColor Red; $script:fail++ }
}

function Api($method, $path, $body, $token) {
  $headers = @{}
  if ($token) { $headers.Authorization = "Bearer $token" }
  $params = @{ Uri = "$base$path"; Method = $method; Headers = $headers }
  if ($body) { $params.ContentType = 'application/json'; $params.Body = ($body | ConvertTo-Json -Depth 6) }
  try { return @{ ok = $true; data = Invoke-RestMethod @params } }
  catch { return @{ ok = $false; status = [int]$_.Exception.Response.StatusCode; data = $null } }
}

# ---------- 1. Register / login ----------
$email = "tester$(Get-Random)@flowboard.app"
$r = Api 'POST' '/auth/register' @{ name = 'Test Engineer'; email = $email; password = 'Secret123!' }
Check 'Register new user' ($r.ok -and $r.data.data.token) "status=$($r.status)"
$testToken = $r.data.data.token

$r = Api 'POST' '/auth/register' @{ name = 'Dup'; email = $email; password = 'Secret123!' }
Check 'Duplicate email rejected (409)' ($r.status -eq 409) "status=$($r.status)"

$r = Api 'POST' '/auth/register' @{ name = 'X'; email = 'nope'; password = '1' }
Check 'Register validation errors (400)' ($r.status -eq 400) "status=$($r.status)"

$r = Api 'POST' '/auth/login' @{ email = 'aarav@flowboard.app'; password = 'Password123!' }
Check 'Login seeded user' ($r.ok -and $r.data.data.token) "status=$($r.status)"
$token = $r.data.data.token

$r = Api 'POST' '/auth/login' @{ email = 'aarav@flowboard.app'; password = 'wrong' }
Check 'Wrong password rejected (401)' ($r.status -eq 401) "status=$($r.status)"

$r = Api 'GET' '/auth/me' $null $token
Check 'GET /auth/me' ($r.ok -and $r.data.data.user.email -eq 'aarav@flowboard.app')

$r = Api 'GET' '/projects'
Check 'Protected route without token (401)' ($r.status -eq 401) "status=$($r.status)"

$r = Api 'GET' '/projects' $null 'bogus.token.value'
Check 'Invalid token rejected (401)' ($r.status -eq 401) "status=$($r.status)"

# ---------- 2. Projects ----------
$r = Api 'GET' '/projects' $null $token
$projects = $r.data.data
Check 'List projects (3 seeded)' ($projects.Count -eq 3) "count=$($projects.Count)"
Check 'Project stats present' ($projects[0].stats.total -gt 0 -and $null -ne $projects[0].stats.progress)

$r = Api 'GET' '/projects?q=web' $null $token
Check 'Project search filter' ($r.data.data.Count -eq 1 -and $r.data.data[0].name -like '*Web*') "count=$($r.data.data.Count)"

$r = Api 'GET' '/projects?status=COMPLETED' $null $token
Check 'Project status filter' ($r.data.data.Count -eq 1) "count=$($r.data.data.Count)"

$r = Api 'GET' '/projects?sort=name' $null $token
$names = $r.data.data | ForEach-Object { $_.name }
$sorted = $names | Sort-Object
Check 'Project sort by name' (($names -join '|') -eq ($sorted -join '|')) ($names -join ', ')

$json = $r.data | ConvertTo-Json -Depth 8
Check 'No password hash in payload' (-not $json.Contains('password'))

$r = Api 'POST' '/projects' @{ name = 'API Test Project'; description = 'Created by the automated test run.'; status = 'ACTIVE'; startDate = '2026-01-05'; dueDate = '2026-03-01'; memberIds = @() } $token
Check 'Create project' ($r.ok) "status=$($r.status)"
$projectId = $r.data.data.id
Check 'Creator is OWNER member' ($r.data.data.members[0].role -eq 'OWNER')
Check 'Create response has progress' ($null -ne $r.data.data.stats.progress)

$r = Api 'GET' "/projects/$projectId" $null $token
Check 'Get project by id' ($r.ok -and $r.data.data.name -eq 'API Test Project')

$r = Api 'PUT' "/projects/$projectId" @{ name = 'API Test Project Renamed'; status = 'ON_HOLD' } $token
Check 'Update project' ($r.ok -and $r.data.data.name -eq 'API Test Project Renamed' -and $r.data.data.status -eq 'ON_HOLD')

$r = Api 'PUT' "/projects/$projectId" @{ name = 'no' } $token
Check 'Update project validation (400)' ($r.status -eq 400) "status=$($r.status)"

# ---------- 3. Members ----------
$r = Api 'GET' "/projects/$projectId/members" $null $token
Check 'List members' ($r.ok -and $r.data.data.Count -eq 1) "count=$($r.data.data.Count)"

$r = Api 'GET' '/users?q=priya' $null $token
$priya = $r.data.data | Where-Object { $_.email -eq 'priya@flowboard.app' } | Select-Object -First 1
Check 'User search' ($null -ne $priya) "results=$($r.data.data.Count)"

$r = Api 'POST' "/projects/$projectId/members" @{ userId = $priya.id } $token
Check 'Add member' ($r.ok -and $r.data.data.user.email -eq 'priya@flowboard.app') "status=$($r.status)"

$r = Api 'POST' "/projects/$projectId/members" @{ userId = $priya.id } $token
Check 'Add duplicate member rejected (409)' ($r.status -eq 409) "status=$($r.status)"

$loginP = Api 'POST' '/auth/login' @{ email = 'priya@flowboard.app'; password = 'Password123!' }
$priyaToken = $loginP.data.data.token

$r = Api 'POST' "/projects/$projectId/members" @{ userId = 'x' } $priyaToken
Check 'Non-owner blocked from managing members (403)' ($r.status -eq 403) "status=$($r.status)"

# ---------- 4. Tasks ----------
$r = Api 'POST' "/projects/$projectId/tasks" @{ title = 'Write integration tests'; description = 'Cover the main API surface.'; status = 'TODO'; priority = 'HIGH'; dueDate = '2026-02-01'; assigneeId = $priya.id } $token
Check 'Create task' ($r.ok -and $r.data.data.title -eq 'Write integration tests') "status=$($r.status)"
$taskId = $r.data.data.id

$r = Api 'POST' "/projects/$projectId/tasks" @{ title = 'x' } $token
Check 'Task validation (400)' ($r.status -eq 400) "status=$($r.status)"

$r = Api 'GET' "/projects/$projectId/tasks" $null $token
Check 'List tasks' ($r.data.data.Count -eq 1) "count=$($r.data.data.Count)"
Check 'Task includes comment count' ($null -ne $r.data.data[0]._count.comments)

$r = Api 'PUT' "/tasks/$taskId" @{ status = 'IN_PROGRESS' } $token
Check 'Change task status (board move)' ($r.ok -and $r.data.data.status -eq 'IN_PROGRESS') "status=$($r.status)"

$r = Api 'PUT' "/tasks/$taskId" @{ priority = 'URGENT' } $token
Check 'Change task priority' ($r.data.data.priority -eq 'URGENT')

$r = Api 'GET' "/projects/$projectId/tasks?status=IN_PROGRESS" $null $token
Check 'Task status filter' ($r.data.data.Count -eq 1) "count=$($r.data.data.Count)"

$r = Api 'GET' "/projects/$projectId/tasks?status=TODO" $null $token
Check 'Task status filter excludes moved' ($r.data.data.Count -eq 0) "count=$($r.data.data.Count)"

$r = Api 'GET' "/projects/$projectId/tasks?q=integration" $null $token
Check 'Task search' ($r.data.data.Count -eq 1) "count=$($r.data.data.Count)"

$r = Api 'GET' "/projects/$projectId/tasks?assignee=$($priya.id)" $null $token
Check 'Task assignee filter' ($r.data.data.Count -eq 1) "count=$($r.data.data.Count)"

$r = Api 'GET' "/tasks/$taskId" $null $token
Check 'Get task detail' ($r.ok -and $r.data.data.project.name -eq 'API Test Project Renamed')
Check 'Task detail has activity' ($r.data.data.activities.Count -ge 2) "count=$($r.data.data.activities.Count)"

$r = Api 'POST' "/projects/$projectId/tasks" @{ title = 'Bad assignee task'; assigneeId = 'not-a-member' } $token
Check 'Non-member assignee rejected (400)' ($r.status -eq 400) "status=$($r.status)"

# ---------- 5. Comments ----------
$r = Api 'POST' "/tasks/$taskId/comments" @{ content = 'Looks good, shipping after review.' } $token
Check 'Add comment' ($r.ok -and $r.data.data.author.email -eq 'aarav@flowboard.app') "status=$($r.status)"
$commentId = $r.data.data.id

$r = Api 'GET' "/tasks/$taskId/comments" $null $token
Check 'List comments' ($r.data.data.Count -eq 1) "count=$($r.data.data.Count)"

$r = Api 'POST' "/tasks/$taskId/comments" @{ content = '' } $token
Check 'Empty comment rejected (400)' ($r.status -eq 400) "status=$($r.status)"

$r = Api 'DELETE' "/comments/$commentId" $null $priyaToken
Check 'Cannot delete another users comment (403)' ($r.status -eq 403) "status=$($r.status)"

$r = Api 'DELETE' "/comments/$commentId" $null $token
Check 'Delete own comment' ($r.ok) "status=$($r.status)"

# ---------- 6. Dashboard + activity ----------
$r = Api 'GET' '/dashboard' $null $token
$stats = $r.data.data.stats
Check 'Dashboard stats' ($stats.totalProjects -eq 4 -and $stats.pendingTasks -gt 0) "projects=$($stats.totalProjects) pending=$($stats.pendingTasks)"
Check 'Dashboard recent activity' ($r.data.data.recentActivity.Count -gt 0) "count=$($r.data.data.recentActivity.Count)"

$r = Api 'GET' "/projects/$projectId/activities" $null $token
Check 'Project activity feed' ($r.ok -and $r.data.data.Count -ge 3) "count=$($r.data.data.Count)"

# ---------- 7. Authorization + persistence ----------
$r = Api 'GET' "/projects/$projectId" $null $testToken
Check 'Non-member blocked from project (403)' ($r.status -eq 403) "status=$($r.status)"

$r = Api 'DELETE' "/projects/$projectId" $null $priyaToken
Check 'Non-owner blocked from deleting project (403)' ($r.status -eq 403) "status=$($r.status)"

$r = Api 'DELETE' "/tasks/$taskId" $null $priyaToken
Check 'Assignee can delete own task' ($r.ok) "status=$($r.status)"

$r = Api 'DELETE' "/projects/$projectId/members/$($priya.id)" $null $token
Check 'Remove member' ($r.ok) "status=$($r.status)"

$r = Api 'DELETE' "/projects/$projectId" $null $token
Check 'Delete project (owner)' ($r.ok) "status=$($r.status)"

$r = Api 'GET' "/projects/$projectId" $null $token
Check 'Deleted project returns 404' ($r.status -eq 404) "status=$($r.status)"

$r = Api 'GET' '/projects' $null $token
Check 'Back to 3 projects' ($r.data.data.Count -eq 3) "count=$($r.data.data.Count)"

Write-Host ""
if ($script:fail -eq 0) { Write-Host "RESULT: $script:pass passed, 0 failed" -ForegroundColor Green }
else { Write-Host "RESULT: $script:pass passed, $script:fail failed" -ForegroundColor Red }
exit $(if ($script:fail -eq 0) { 0 } else { 1 })

