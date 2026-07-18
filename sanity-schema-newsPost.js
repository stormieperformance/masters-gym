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
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'tag',
      title: 'Tag',
      type: 'string',
      description: 'Short label shown on the card, e.g. "Nyhet", "Event", "Schema"',
      initialValue: 'Nyhet',
    },
    {
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'teaser',
      title: 'Short teaser',
      type: 'text',
      rows: 3,
      description: 'The short summary shown on the news card',
      validation: (Rule) => Rule.required().max(220),
    },
    {
      name: 'body',
      title: 'Full text (optional)',
      type: 'text',
      rows: 10,
      description: 'Longer version, for when a full article view is added later',
    },
    {
      name: 'mainImage',
      title: 'Image (optional)',
      type: 'image',
      options: { hotspot: true },
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
