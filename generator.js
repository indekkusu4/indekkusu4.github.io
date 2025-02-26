
import * as fs from 'fs';

const bibliography = fs.readFileSync('./bibliography.txt', { encoding: 'utf-8' }).split('@');

/**
 * write bibliography markdown [taxon: reference] from single biblatex data.
 * @param {*} item single biblatex data
 * @returns {string} slug
 */
const parse = (item) => {
  const data = item.trim().split('\n');
  data.pop(); // drop `}`

  const pos = data[0].indexOf('{');
  const slug = dropOptionLastComma(data[0].substring(pos + 1).trim());

  const metadataProps = {};
  for (let i = 1; i < data.length; i++) {
    const pos = data[i].indexOf('=');
    const key = data[i].substring(0, pos).trim();
    const res = dropOptionLastComma(data[i].substring(pos + 1).trim());
    const val = dropBraces(res);

    switch (key) {
      case 'year': metadataProps['!date'] = val; break;
      case 'title': metadataProps[key] = adjustTitleText(val); break;
      case 'author': metadataProps[key] = adjustAuthorText(val); break;
    }
  }

  const metadataBlock = generateMetadataBlock(metadataProps);
  const markdown = `${metadataBlock}\n\n` + '```\n' + `@${item}` + '```\n';
  fs.writeFileSync(`./${slug}.md`, markdown, { encoding: 'utf-8' });
  return slug;
}

const dropOptionLastComma = s => s[s.length - 1] == ',' ? s.substring(0, s.length - 1) : s;
const dropBraces = s => s.substring(1, s.length - 1);

const adjustTitleText = s => s.replace(/{\\"([a-z])}/g, "$1\u0308");
const adjustAuthorText = s => s.split(' and ').map(u => u.split(', ').reverse().join(' ')).join(', ');

const generateMetadataBlock = (metadataProps) => {
  let metadataBlock = '';

  const metadataKeys = Object.keys(metadataProps);
  for (const key of metadataKeys) {
    metadataBlock += `${key}: ${metadataProps[key]}\n`;
  }
  return `---\n${metadataBlock}---`;
}

const generateAll = () => {
  let index = `---\ntitle: Indekkusu\ndate: last-modified\ncollect: true\n---\n\n`;

  for (let i = 1; i < bibliography.length; i++) {
    const slug = parse(bibliography[i]);
    index += `[-](/${slug}.md#:embed)\n`;
  }

  index += `
<script>
  const lastModifiedDate = new Date(document.lastModified);
  const lastModifiedDateText = lastModifiedDate.toLocaleDateString('en-US', 
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dateItem = [...document.querySelectorAll('li')]
    .filter(x => x.textContent == 'last-modified')[0]; 
  dateItem.textContent = lastModifiedDateText;
</script>`;
  fs.writeFileSync(`./index.md`, index, { encoding: 'utf-8' });
}

generateAll();
