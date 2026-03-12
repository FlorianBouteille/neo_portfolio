// load express
const express = require('express');
const engine = require('ejs-mate');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const projectsJsonPath = path.join(__dirname, 'data', 'projects.json');

async function readProjects() {
  const rawData = await fs.readFile(projectsJsonPath, 'utf8');
  return JSON.parse(rawData);
}

async function writeProjects(projects) {
  await fs.writeFile(projectsJsonPath, JSON.stringify(projects, null, 2), 'utf8');
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/'); // Dossier où les images seront stockées
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom du fichier avec timestamp
  }
});

const upload = multer({ storage: storage });

//create app
const app = express();
app.use(express.urlencoded({ extended: true }));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//Use files in the 'public' folder
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

const session = require('express-session');

app.use(session({
  secret: 'une-cle-secrete-bien-longue',
  resave: false,
  saveUninitialized: false
}));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.redirect('/login');
  }
}

//Route to the projects

app.get('/', (req, res) => {
	res.render('index', { pageTitle: 'Mon Portfolio' });
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await readProjects();
    res.json(projects);
  } catch (err) {
    return res.status(500).json({error: 'Database reading Error'});
  }
});

app.get('/projects', async (req, res) => {
  try {
    const projects = await readProjects();
    res.render('projects', {projects: projects, 
                          pageTitle: 'Mes Projets'});
  } catch (err) {
    return res.status(500).send('Erreur de lecture des projets.');
  }
});

app.get('/projects/:title', async (req, res) => {
  const { title } = req.params;

  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.title === title);

    if (!project) {
      return res.status(404).send('Projet non trouvé.');
    }
    res.render('project', { project,
                          pageTitle: project.title });
  } catch (err) {
    return res.status(500).send('Erreur de lecture du projet.');
  }
});

app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const projects = await readProjects();
    res.render('admin', { projects, pageTitle: 'Admin' });
  } catch (err) {
    return res.status(500).send('Erreur de lecture des projets.');
  }
});

app.post('/admin', requireAdmin, upload.single('image'), async (req, res) => {
  const { title, description, date, type, url } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  try {
    const projects = await readProjects();
    const existingProject = projects.find((item) => item.title === title);

    if (existingProject) {
      return res.status(400).send('Un projet avec ce titre existe déjà.');
    }

    const newProject = {
      title,
      description,
      date,
      type,
      url,
      image
    };

    projects.push(newProject);
    await writeProjects(projects);
    res.redirect('/projects');
  } catch (err) {
    return res.status(500).send('Erreur de sauvegarde du projet.');
  }
});

app.post('/admin/delete/:title', requireAdmin, async (req, res) => {
  const { title } = req.params;

  try {
    const projects = await readProjects();
    const filteredProjects = projects.filter((item) => item.title !== title);
    await writeProjects(filteredProjects);
    res.redirect('/admin');
  } catch (err) {
    return res.status(500).send('Erreur de suppression du projet.');
  }
});

app.get('/admin/edit/:title', requireAdmin, async (req, res) => {
  const title = req.params.title;

  try {
    const projects = await readProjects();
    const project = projects.find((item) => item.title === title);

    if (!project) return res.status(404).send('Projet non trouvé.');

    res.render('edit', { project, pageTitle: 'Edit projects' });
  } catch (err) {
    return res.status(500).send('Erreur de lecture du projet.');
  }
});

app.post('/admin/edit/:title', requireAdmin, async (req, res) => {
  const originalTitle = req.params.title;
  const { title, description, date, type, url } = req.body;

  try {
    const projects = await readProjects();
    const projectIndex = projects.findIndex((item) => item.title === originalTitle);

    if (projectIndex === -1) {
      return res.status(404).send('Projet non trouvé.');
    }

    const duplicateTitle = projects.find(
      (item, index) => item.title === title && index !== projectIndex
    );

    if (duplicateTitle) {
      return res.status(400).send('Un projet avec ce titre existe déjà.');
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      title,
      description,
      date,
      type,
      url
    };

    await writeProjects(projects);
    res.redirect('/admin');
  } catch (err) {
    return res.status(500).send('Erreur de mise à jour du projet.');
  }
});

app.get('/login', (req, res) => {
  res.render('login', { pageTitle : 'Login' });
});

app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.send('Mot de passe incorrect');
  }
});

//listen on port 3000
const port = process.env.PORT || 3000
app.listen(port, ()=> 
	{
		console.log(`Serveur online on port ${port}`);
	});
