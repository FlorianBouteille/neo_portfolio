const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const publicDir = path.join(__dirname, 'public');

const projectsJsonPath = path.join(publicDir, 'data', 'projects.json');

async function readProjects() {
  const rawData = await fs.readFile(projectsJsonPath, 'utf8');
  const parsedData = JSON.parse(rawData);
  return Array.isArray(parsedData) ? parsedData : parsedData.projects || [];
}

const app = express();
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(publicDir, 'projects.html'));
});

app.get('/project', (req, res) => {
  res.sendFile(path.join(publicDir, 'project.html'));
});

app.get('/projects/:title', (req, res) => {
  res.redirect(`/project?title=${encodeURIComponent(req.params.title)}`);
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await readProjects();
    res.json(projects);
  } catch (err) {
    return res.status(500).json({error: 'Database reading Error'});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Static local server running on port ${port}`);
});
