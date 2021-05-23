module.exports = {
  siteMetadata: {
    title: `is SNL new tonight?`,
    description: 'Hi, are you always searching to see if Saturday Night Live is really LIVE? Look no further!',
    author: 'Josh Stein',
  },
  plugins: [
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `is SNL new tonight?`,
        short_name: `is SNL new?`,
        start_url: `/`,
        background_color: `#fff0f5`,
        theme_color: `#fff0f5`,
        display: `standalone`,
        icon: `src/images/icon.png`,
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `src`,
        path: `${__dirname}/src/`,
      },
    },
    `gatsby-transformer-remark`,
    `gatsby-plugin-emotion`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [`gatsby-remark-responsive-iframe`],
      },
    },
  ],
  
}