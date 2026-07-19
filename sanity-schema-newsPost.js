// Sanity schema for Masters Gym news posts.
// Add this file to your Sanity Studio project's schema folder
// (e.g. schemaTypes/newsPost.js) and register it in schemaTypes/index.js.

export default {
  name: 'newsPost',
  title: 'News post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The headline shown on the news card, e.g. "Höstschema 2026"',
      validation: (Rule) => Rule.required().max(80).warning('Keep it short, long titles get cut off on the card'),
    },
    {
      name: 'tag',
      title: 'Tag',
      type: 'string',
      description: 'Short label shown on the card, e.g. "Nyhet", "Event", "Schema"',
      initialValue: 'Nyhet',
      validation: (Rule) => Rule.max(20),
    },
    {
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      description: 'The post won\'t appear on the site until this date and time. Set it in the future to schedule a post in advance.',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'teaser',
      title: 'Short teaser',
      type: 'text',
      rows: 3,
      description: 'The short summary shown on the news card. Keep it to 1-2 sentences.',
      validation: (Rule) => Rule.required().min(10).max(220),
    },
    {
      name: 'body',
      title: 'Full text (optional)',
      type: 'text',
      rows: 10,
      description: 'The longer version, shown when someone clicks "Läs mer" on the card. Leave empty to only show the short teaser.',
    },
    {
      name: 'mainImage',
      title: 'Image (optional)',
      type: 'image',
      description: 'Shown at the top of the news card. Landscape photos work best.',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Image description',
          type: 'string',
          description: 'Describe what\'s in the photo, for people using screen readers, e.g. "Members training on the mats". Required if an image is added.',
          validation: (Rule) => Rule.custom((alt, context) => {
            if (context.parent?.asset && !alt) {
              return 'Please add a short description for this image'
            }
            return true
          }),
        },
      ],
    },
    {
      name: 'seoDescription',
      title: 'Search engine description (optional)',
      type: 'text',
      rows: 2,
      description: 'What shows up in Google search results and when this post is shared on social media. If left empty, the short teaser is used instead.',
      validation: (Rule) => Rule.max(160).warning('Google usually cuts this off after ~160 characters'),
    },
    {
      name: 'interestForm',
      title: 'Add a signup / interest form?',
      type: 'boolean',
      description: 'Turn this on to add a short form at the bottom of this post, e.g. to gauge interest in a comeback class or event. Submissions are emailed to you.',
      initialValue: false,
    },
    {
      name: 'interestFormQuestion',
      title: 'Form question',
      type: 'string',
      description: 'The question asked in the form, e.g. "Vilket morgonpass passar dig?" Only shown if the form above is turned on.',
      hidden: ({parent}) => !parent?.interestForm,
    },
    {
      name: 'interestFormButtonText',
      title: 'Submit button text (optional)',
      type: 'string',
      description: 'Defaults to "Skicka" if left empty.',
      hidden: ({parent}) => !parent?.interestForm,
    },
  ],
  orderings: [
    {
      title: 'Published date, newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'tag', media: 'mainImage' },
  },
}

