document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('project-page');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const title = params.get('title');

  function renderNotFound() {
    const message = document.createElement('p');
    message.className = 'electrolize-regular';
    message.textContent = 'Projet introuvable.';
    container.replaceChildren(message);
  }

  function createLabeledParagraph(label, value) {
    const paragraph = document.createElement('p');
    paragraph.className = 'electrolize-regular';
    const strong = document.createElement('strong');
    strong.textContent = `${label} : `;
    paragraph.append(strong, document.createTextNode(value || ''));
    return paragraph;
  }

  if (!title) {
    renderNotFound();
    return;
  }

  try {
    const response = await fetch('/data/projects.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load projects data.');

    const payload = await response.json();
    const projects = Array.isArray(payload) ? payload : payload.projects || [];
    const project = projects.find((item) => item.title === title);

    if (!project) {
      renderNotFound();
      return;
    }

    document.title = project.title;

    const image = document.createElement('img');
    image.className = 'mainImage';
    image.src = project.image;
    image.alt = project.title;

    const description = createLabeledParagraph('Description', project.description);
    description.style.whiteSpace = 'pre-line';

    const date = createLabeledParagraph('Date', project.date);

    const url = document.createElement('p');
    url.className = 'electrolize-regular';
    const urlLabel = document.createElement('strong');
    urlLabel.textContent = 'URL : ';
    const urlLink = document.createElement('a');
    urlLink.href = project.url || '#';
    urlLink.target = '_blank';
    urlLink.rel = 'noopener noreferrer';
    urlLink.textContent = project.url || '';
    url.append(urlLabel, urlLink);

    container.append(image, description, date, url);
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'electrolize-regular';
    message.textContent = 'Impossible de charger le projet.';
    container.replaceChildren(message);
  }
});
