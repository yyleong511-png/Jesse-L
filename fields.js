/*
  fields.js — describes every editable field in content.json.
  Each section becomes a collapsible block; each field becomes one input.
  type: 'text' | 'textarea' | 'url'
*/
var SECTIONS = [
  {
    key: 'home',
    eyebrow: 'N°01',
    title: 'Home',
    note: 'The full-screen slide on the homepage.',
    fields: [
      { path: 'home.eyebrow', label: 'Small tag, top left', type: 'text' },
      { path: 'home.nameLine1', label: 'Name — line 1', type: 'text' },
      { path: 'home.nameLine2', label: 'Name — line 2', type: 'text' },
      { path: 'home.roleBefore', label: 'Role — before the slash', type: 'text' },
      { path: 'home.roleAfter', label: 'Role — after the slash', type: 'text' },
      { path: 'home.captionLine1', label: 'Caption — line 1', type: 'text' },
      { path: 'home.captionLine2', label: 'Caption — line 2', type: 'text' }
    ]
  },
  {
    key: 'about',
    eyebrow: 'N°02',
    title: 'About Me',
    note: 'Bio text and measurements. Photos aren\u2019t editable here.',
    fields: [
      { path: 'about.eyebrow', label: 'Small tag, top left', type: 'text' },
      { path: 'about.bio1Rest', label: 'Bio — paragraph 1 (the big "J" at the start stays fixed)', type: 'textarea' },
      { path: 'about.bio2', label: 'Bio — paragraph 2', type: 'textarea' },
      { path: 'about.stats.0.value', label: 'Height', type: 'text' },
      { path: 'about.stats.1.value', label: 'Weight', type: 'text' },
      { path: 'about.stats.2.value', label: 'Bust', type: 'text' },
      { path: 'about.stats.3.value', label: 'Waist', type: 'text' },
      { path: 'about.stats.4.value', label: 'Hips', type: 'text' },
      { path: 'about.stats.5.value', label: 'Shoulder', type: 'text' },
      { path: 'about.stats.6.value', label: 'Shoe', type: 'text' },
      { path: 'about.stats.7.value', label: 'Based in', type: 'text' }
    ]
  },
  {
    key: 'work',
    eyebrow: 'N°03',
    title: 'Previous Work',
    note: 'Titles and credit lines for each series, plus the KLFW and ISMC panels. Photos aren\u2019t editable here.',
    fields: [
      { path: 'work.eyebrow', label: 'Small tag, top left', type: 'text' },
      { path: 'work.heading', label: 'Page heading', type: 'text' },
      { path: 'work.intro', label: 'Intro paragraph', type: 'textarea' },
      { group: 'Series 01', fields: [
        { path: 'work.series.0.title', label: 'Title', type: 'text' },
        { path: 'work.series.0.desc', label: 'Credit line', type: 'text' }
      ]},
      { group: 'Series 02', fields: [
        { path: 'work.series.1.title', label: 'Title', type: 'text' },
        { path: 'work.series.1.desc', label: 'Credit line', type: 'text' }
      ]},
      { group: 'Series 03', fields: [
        { path: 'work.series.2.title', label: 'Title', type: 'text' },
        { path: 'work.series.2.desc', label: 'Credit line', type: 'text' }
      ]},
      { group: 'Series 04', fields: [
        { path: 'work.series.3.title', label: 'Title', type: 'text' },
        { path: 'work.series.3.desc', label: 'Credit line', type: 'text' }
      ]},
      { group: 'Series 05', fields: [
        { path: 'work.series.4.title', label: 'Title', type: 'text' },
        { path: 'work.series.4.desc', label: 'Credit line', type: 'text' }
      ]},
      { group: 'Series 06', fields: [
        { path: 'work.series.5.title', label: 'Title', type: 'text' },
        { path: 'work.series.5.desc', label: 'Credit line', type: 'text' }
      ]},
      { group: 'KLFW panel', fields: [
        { path: 'work.klfw.eyebrow', label: 'Tag', type: 'text' },
        { path: 'work.klfw.title', label: 'Title', type: 'text' },
        { path: 'work.klfw.text', label: 'Text', type: 'textarea' }
      ]},
      { group: 'ISMC panel', fields: [
        { path: 'work.ismc.eyebrow', label: 'Tag', type: 'text' },
        { path: 'work.ismc.title', label: 'Title', type: 'text' },
        { path: 'work.ismc.text', label: 'Text', type: 'textarea' }
      ]}
    ]
  },
  {
    key: 'more',
    eyebrow: 'N°04',
    title: 'More',
    note: 'The "Also Working On" list.',
    fields: [
      { path: 'more.eyebrow', label: 'Small tag, top left', type: 'text' },
      { path: 'more.heading', label: 'Page heading', type: 'text' },
      { path: 'more.intro', label: 'Intro line', type: 'text' },
      { group: 'Item 01', fields: [
        { path: 'more.items.0.title', label: 'Title', type: 'text' },
        { path: 'more.items.0.text', label: 'Body text', type: 'textarea' },
        { path: 'more.items.0.link1Label', label: 'Link label', type: 'text' },
        { path: 'more.items.0.link1Href', label: 'Link URL', type: 'url' }
      ]},
      { group: 'Item 02', fields: [
        { path: 'more.items.1.title', label: 'Title', type: 'text' },
        { path: 'more.items.1.text', label: 'Body text', type: 'textarea' },
        { path: 'more.items.1.link1Label', label: 'Link label', type: 'text' },
        { path: 'more.items.1.link1Href', label: 'Link URL', type: 'url' }
      ]},
      { group: 'Item 03', fields: [
        { path: 'more.items.2.title', label: 'Title', type: 'text' },
        { path: 'more.items.2.text', label: 'Body text', type: 'textarea' },
        { path: 'more.items.2.link1Label', label: 'Link label', type: 'text' },
        { path: 'more.items.2.link1Href', label: 'Link URL', type: 'url' }
      ]},
      { group: 'Item 04', fields: [
        { path: 'more.items.3.title', label: 'Title', type: 'text' },
        { path: 'more.items.3.text', label: 'Body text', type: 'textarea' },
        { path: 'more.items.3.link1Label', label: 'Link label', type: 'text' },
        { path: 'more.items.3.link1Href', label: 'Link URL', type: 'url' }
      ]},
      { group: 'Item 05', fields: [
        { path: 'more.items.4.title', label: 'Title', type: 'text' },
        { path: 'more.items.4.text', label: 'Body text', type: 'textarea' },
        { path: 'more.items.4.link1Label', label: 'Link 1 label', type: 'text' },
        { path: 'more.items.4.link1Href', label: 'Link 1 URL', type: 'url' },
        { path: 'more.items.4.link2Label', label: 'Link 2 label', type: 'text' },
        { path: 'more.items.4.link2Href', label: 'Link 2 URL', type: 'url' }
      ]}
    ]
  },
  {
    key: 'contact',
    eyebrow: 'N°05',
    title: 'Contact',
    note: '',
    fields: [
      { path: 'contact.eyebrow', label: 'Small tag, top left', type: 'text' },
      { path: 'contact.headingLine1', label: 'Heading — line 1', type: 'text' },
      { path: 'contact.headingLine2', label: 'Heading — line 2', type: 'text' },
      { group: 'Instagram', fields: [
        { path: 'contact.links.0.value', label: 'Handle shown', type: 'text' },
        { path: 'contact.links.0.href', label: 'Link URL', type: 'url' }
      ]},
      { group: 'Email', fields: [
        { path: 'contact.links.1.value', label: 'Address shown', type: 'text' },
        { path: 'contact.links.1.href', label: 'mailto: link', type: 'url' }
      ]},
      { group: 'WhatsApp', fields: [
        { path: 'contact.links.2.value', label: 'Number shown', type: 'text' },
        { path: 'contact.links.2.href', label: 'wa.me link', type: 'url' }
      ]}
    ]
  },
  {
    key: 'site',
    eyebrow: '',
    title: 'Footer (every page)',
    note: '',
    fields: [
      { path: 'site.footerCopyright', label: 'Copyright line', type: 'text' },
      { path: 'site.footerLocation', label: 'Location line', type: 'text' }
    ]
  }
];
