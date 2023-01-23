"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { unfurl } = require("unfurl.js");

module.exports = {
  findById(id) {
    return strapi.query("feed-post").findOne({ _id: id });
  },

  getPreviewCard({ url, title, description, image }) {
    return (`
      <a
        style="width: 100%; cursor: pointer; outline: none; text-decoration: none; color: black;"
        href="${url}"
        target="_blank"
      >
        <div style="width: ${image?.width || 400}px; max-width: 100%; height: 100%; max-height: 350px; border: 1px solid #80808047; border-radius: 4px; margin: 0px auto; box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);">
          <div style="width: 100%; height: ${image?.height || 250}px; max-height: 250px; border-top-left-radius: 4px; border-top-right-radius: 4px;">
            <img
              src="${typeof image === 'string' ? image : image?.url}"
              alt="${image?.alt || title}"
              style="width: 100%; height: 100%; object-fit: cover; border-top-left-radius: 4px; border-top-right-radius: 4px;"
            />
          </div>
          <div style="padding: 8px;">
            <h3 style="color: #000000e6; margin: 0px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
              ${title}
            </h3>
            <p style="color: #000000b8; margin: 8px 0px 0px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
              ${description}
            </p>
          </div>
        </div>
      </a>
    `)
  },

  async getAchorText(text) {
    let textWithNextLines = text.replace(/\n/g, ' <br /> ');
    
    const linkRegexExp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

    let linkIndex = 0;
    let links = [];

    textWithNextLines.split(' ').forEach(item => {
      const match = item.match(linkRegexExp);

      if (match?.[0] && !match[0].includes('youtube')) {
        const textLink = match[0];
        links.push(textLink);
        linkIndex++;
      }
    });

    let formattedData = [];

    try {
      const response = await Promise.allSettled(links.map(url => unfurl(url)));
      if (response) {
        formattedData = response.map((item, index) => {
          return {
            url: links[index],
            data: {
              title: item?.status === "fulfilled" ? (item.value?.open_graph?.title || item.value?.title || "") : "",
              description: item?.status === "fulfilled" ? (item.value?.open_graph?.description || item.value?.description || "") : "",
              image: item?.status === "fulfilled" ? (item.value?.open_graph?.images?.[0] || item.value?.favicon || "") : "",
            }
          }
        });
      }

      if (links?.length) {
        textWithNextLines = textWithNextLines.split(' ').map(item => {
          const match = item.match(linkRegexExp);

          if (match?.[0]) {
            const textLink = match[0];
            const linkData = formattedData.find(item => item.url === textLink);
           
            if (linkData?.data?.title) {
              const { title, description, image } = linkData.data;
              return this.getPreviewCard({ url: linkData.url, title, description, image });
            }
           
            return `<a target="_blank" style="color: blue" href="${textLink}">${textLink}</a>`
          }

          return item;
        }).join(' ');
      }
    } catch(e) {
      console.log(e)
    }

    return textWithNextLines;
  }
};
