const {
  parseMarkdown,
  splitByHeadings,
  toTree,
} = require('./parseMarkdown');
const marked = require('marked');

describe('splitByHeadings', () => {
  it('splits h1s', () => {
    const md = `
# First heading

Content under first heading

## X

yyy

### Z
hhh

# Second heading

Content under second heading

# Third heading

Content under third heading
    `.trim();
    const tokens = marked.lexer(md);

    expect(splitByHeadings(tokens, 1)).toEqual([
      [
        { type: 'heading', depth: 1, text: 'First heading' },
        { type: 'paragraph', text: 'Content under first heading' },
        { type: 'space' },
        { type: 'heading', depth: 2, text: 'X' },
        { type: 'paragraph', text: 'yyy' },
        { type: 'space' },
        { type: 'heading', depth: 3, text: 'Z' },
        { type: 'paragraph', text: 'hhh' },
        { type: 'space' },
      ],
      [
        { type: 'heading', depth: 1, text: 'Second heading' },
        { type: 'paragraph', text: 'Content under second heading' },
        { type: 'space' },
      ],
      [
        { type: 'heading', depth: 1, text: 'Third heading' },
        { type: 'paragraph', text: 'Content under third heading' },
      ],
    ]);
  });

  it('splits by heading', () => {
    const md = `
# H1

## H2

- Item: One
- Item Two without a colon

Stuff with a [link][link]

[link]: http://link

## Another h2

- Status: Cool
- Really: Yep

Eh
    `.trim();
    const tokens = marked.lexer(md);
    expect(toTree(tokens)).toEqual({
      name: 'H1',
      tokens: [],
      sections: [
        {
          name: 'H2',
          tokens: [
            { type: 'list_start', ordered: false, start: '', loose: false },
            {
              type: 'list_item_start',
              task: false,
              checked: undefined,
              loose: false,
            },
            { type: 'text', text: 'Item: One' },
            { type: 'list_item_end' },
            {
              type: 'list_item_start',
              task: false,
              checked: undefined,
              loose: false,
            },
            { type: 'text', text: 'Item Two without a colon' },
            { type: 'space' },
            { type: 'list_item_end' },
            { type: 'list_end' },
            { type: 'paragraph', text: 'Stuff with a [link][link]' },
            { type: 'space' },
          ],
        },
        {
          name: 'Another h2',
          tokens: [
            { type: 'list_start', ordered: false, start: '', loose: false },
            {
              type: 'list_item_start',
              task: false,
              checked: undefined,
              loose: false,
            },
            { type: 'text', text: 'Status: Cool' },
            { type: 'list_item_end' },
            {
              type: 'list_item_start',
              task: false,
              checked: undefined,
              loose: false,
            },
            { type: 'text', text: 'Really: Yep' },
            { type: 'space' },
            { type: 'list_item_end' },
            { type: 'list_end' },
            { type: 'paragraph', text: 'Eh' },
          ],
        },
      ],
    });
  });

  it('ignores pre-h1 and repeated top level headers', () => {
    const md = `
This should be ignored.

# H1

Content

# Another h1

This should be ignored too.
    `.trim();
    const tokens = marked.lexer(md);
    expect(toTree(tokens)).toEqual({
      name: 'H1',
      tokens: [{ type: 'paragraph', text: 'Content' }, { type: 'space' }],
    });
  });

  it('returns an empty object when there are no headers', () => {
    const md = `
This should be ignored.
    `.trim();
    const tokens = marked.lexer(md);
    expect(toTree(tokens)).toEqual({
      tokens: [],
    });
  });
});

describe('parseMarkdown', () => {
  it('parses markdown to JSON', () => {
    const md = `
# H1

## H2

- Item: One
- Item Two without a colon

Stuff with a [link][link]

[link]: http://link

## Another h2

- Status: Cool
- Really: Yep

Eh
  `.trim();
    expect(parseMarkdown(md)).toEqual({
      name: 'H1',
      metadata: {},
      content: [
        {
          name: 'H2',
          metadata: { item: 'One' },
          content: '<p>Stuff with a <a href="http://link">link</a></p>',
        },
        {
          name: 'Another h2',
          metadata: { status: 'Cool', really: 'Yep' },
          content: '<p>Eh</p>',
        },
      ],
    });
  });

  it('ignores text which does not fit the format', () => {
    const md = `
## Stuff

This line should be ignored.

- More
- stuff

Everything after this is kept...

- just
  - pure
  - markdown
    `.trim();
    expect(parseMarkdown(md)).toEqual({
      name: 'Stuff',
      metadata: {},
      content:
        '<p>Everything after this is kept...</p>\n<ul>\n<li>just<ul>\n<li>pure</li>\n<li>markdown</li>\n</ul>\n</li>\n</ul>',
    });
  });

  it('returns an empty object when no h2 headings', () => {
    const md = '# No h2s here';
    expect(parseMarkdown(md)).toEqual({
      name: 'No h2s here',
      metadata: {},
      content: '',
    });
  });

  it.only('handles arbitrary levels', () => {
    const md = `
# H1

### H3

- Item: One

## H2

- Status: Cool
- Really: Yep

Eh
  `.trim();
    expect(parseMarkdown(md)).toEqual({
      name: 'H1',
      metadata: {},
      content: [
        {
          name: 'H3',
          metadata: { item: 'One' },
          content: '',
        },
      ],
    });
  });
});
