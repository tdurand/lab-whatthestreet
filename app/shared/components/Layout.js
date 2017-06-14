import React, { Component } from 'react';
import Head from 'next/head';
import PropTypes from 'prop-types';

import * as METRICS from '../style/metrics';
import * as COLORS from '../style/colors';

class Layout extends Component {

  static propTypes = {
     title: PropTypes.string
  }

  static defaultProps = {
    title: 'What the Street!?'
  }

  componentDidMount() {
    require('smoothscroll-polyfill').polyfill();
  }

  render() {
    return (
      <div>
        <Head>
          <title>What the Street!? - moovel lab</title>
          <meta charset='utf-8' />
          <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
          <meta name="description" content="Who owns the city? Explore the distribution of mobility space amongst urban traffic. Discover every parking lot or street of 23 metropolises." />
          <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/10up-sanitize.css/4.1.0/sanitize.min.css"/>
          <link rel="apple-touch-icon" href="/static/favicon/apple-touch-icon.png" />
          <link rel="icon" type="image/png" href="/static/favicon/favicon.png" />
          <meta property="og:title" content="What the Street!? - moovel lab" />
          <meta property="og:url" content="http://whatthestreet.moovellab.com" />
          <meta property="og:image" content="http://whatthestreet.moovellab.com/static/images/wts-meta@2x.png" />
          <meta property="og:description" content="Who owns the city? Explore the distribution of mobility space amongst urban traffic. Discover every parking lot or street of 23 metropolises." />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="moovel lab" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:site" content="@moovelLab" />
          <meta name="twitter:title" content="What the Street!? - moovel lab" />
          <meta name="twitter:description" content="Who owns the city? Explore the distribution of mobility space amongst urban traffic. Discover every parking lot or street of 23 metropolises." />
          <meta name="twitter:image" content="http://whatthestreet.moovellab.com/static/images/wts-meta@2x.png" />
        </Head>
        <div className="desktop">
          {this.props.children}
        </div>
        <div className="mobile">
          Unfortunately, What the Street!? is only compatible with desktop resolution, you should try it from your computer. 
        </div>
        <style jsx global>{`
          .desktop {
            display: block;
          }

          .mobile {
            display: none;
            padding: 50px;
            text-align: center;
          }
          @media screen and (max-width: 1279px) {
            .desktop {
              display: none;
            }

            .mobile {
              display: block;
            }
          }
          @font-face {
            font-family: 'Larsseit';
            src: url('/static/fonts/Larsseit/Larsseit-Medium.eot');
            src: url('/static/fonts/Larsseit/Larsseit-Medium.ttf');
            src: url('/static/fonts/Larsseit/Larsseit-Medium.woff');
            src: url('/static/fonts/Larsseit/Larsseit-Medium.woff2');
            font-weight: 500;
          }

          @font-face {
            font-family: 'Larsseit';
            src: url('/static/fonts/Larsseit/Larsseit-Light.eot');
            src: url('/static/fonts/Larsseit/Larsseit-Light.ttf');
            src: url('/static/fonts/Larsseit/Larsseit-Light.woff');
            src: url('/static/fonts/Larsseit/Larsseit-Light.woff2');
            font-weight: 300;
          }

          @font-face {
            font-family: 'Sign-Painter';
            src: url('/static/fonts/Sign_Painter_House_Brush/SignPainter_HouseBrush.ttf');
          }

          @font-face {
            font-family: 'Circular';
            src: url('/static/fonts/Circular/CircularStd-Medium.otf');
          }

          html, body {
            min-height: 100%;
            width: 100%;
          }

          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            outline: none;
          }


          body {
            font-family: Larsseit, sans-serif;
            color: ${COLORS.ColorForegroundText};
            line-height: 1;
            font-weight: 300;
          }

          h1 {
            margin: 0;
            line-height: 1em;
            font-size: 36px;
            font-weight: 500;
          }

          h2 {
            font-size: 21px;
            font-weight: 500;
          }

          h3 {
            margin-top: 0;
            font-weight: 500;
          }
        `}</style>
      </div>
    )
  }
}

export default Layout;
