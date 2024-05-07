module.exports = {
    async redirects() {
      return [
        {
          source: '/r/:slug',
          destination: '/?ref=:slug',
          permanent: false,
        },
      ]
    },
  }