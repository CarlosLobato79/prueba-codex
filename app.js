async function loadCourses() {
  const response = await fetch('materias_prerequisitos.csv');
  const text = await response.text();
  const data = parseCSV(text);
  renderCourses(data);
  drawConnections();
  window.addEventListener('resize', drawConnections);
}

function parseCSV(text) {
  const lines = text.trim().split('\n').slice(1);
  return lines.map(line => {
    let inQuotes = false;
    let field = '';
    const fields = [];
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(field);
        field = '';
      } else {
        field += char;
      }
    }
    fields.push(field);
    const [code, name, prereqStr] = fields;
    return {
      code: code.trim(),
      name: name.trim(),
      prereqs: prereqStr.trim().split(/\s+/).filter(Boolean)
    };
  });
}

const courseMap = new Map();

function renderCourses(courses) {
  const container = document.getElementById('course-container');
  container.innerHTML = '';
  courses.forEach(course => {
    const div = document.createElement('div');
    div.className = 'course';
    div.dataset.code = course.code;
    div.innerHTML = `<strong>${course.code}</strong><br>${course.name}`;
    div.addEventListener('click', () => toggleSelect(course.code));
    container.appendChild(div);
    course.element = div;
    courseMap.set(course.code, course);
  });
}

function toggleSelect(code) {
  const course = courseMap.get(code);
  if (!course) return;
  if (course.element.classList.contains('selected')) {
    course.element.classList.remove('selected');
  } else {
    selectWithPrereqs(code, new Set());
  }
}

function selectWithPrereqs(code, visited) {
  if (visited.has(code)) return;
  visited.add(code);
  const course = courseMap.get(code);
  if (!course) return;
  course.element.classList.add('selected');
  course.prereqs.forEach(pr => selectWithPrereqs(pr, visited));
}

function drawConnections() {
  const svg = document.getElementById('connections');
  const diagram = document.getElementById('diagram');
  svg.setAttribute('width', diagram.offsetWidth);
  svg.setAttribute('height', diagram.offsetHeight);
  svg.innerHTML = '';
  courseMap.forEach(course => {
    const rect1 = course.element.getBoundingClientRect();
    const dRect = diagram.getBoundingClientRect();
    const x1 = rect1.left + rect1.width / 2 - dRect.left;
    const y1 = rect1.top + rect1.height / 2 - dRect.top;
    course.prereqs.forEach(pr => {
      const prereq = courseMap.get(pr);
      if (!prereq) return;
      const rect2 = prereq.element.getBoundingClientRect();
      const x2 = rect2.left + rect2.width / 2 - dRect.left;
      const y2 = rect2.top + rect2.height / 2 - dRect.top;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', 'rgba(255,255,255,0.3)');
      line.setAttribute('stroke-width', '2');
      svg.appendChild(line);
    });
  });
}

loadCourses();
