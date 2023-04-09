'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
    async mailData(entity){
      await strapi.plugins["email-designer"].services["email"].sendTemplatedEmail(
        {to:entity.email},
        {
          templateId: 11,
          sourceCodeToTemplateId: 11,
        },
        {
          name: entity.name,
        }
      );
    },
    async shoot(ctx) {
        let entities;
        const query = ctx.query;
        query['state'] = 'willSend';
        query['name'] = {$exists:true, $ne:''};
        var d = new Date();
        d.setHours(d.getHours() - 2);
        query['createdAt_lte'] = d.toISOString();

        entities = await strapi.query("autoemail").find(query);
        return entities.map((entity) => {
            try{
                this.mailData(entity);
                strapi.services.autoemail.update({ id: entity.id }, {state:'sent'});
            }catch(e){
                strapi.services.autoemail.update({ id: entity.id }, {state:'error'});
                console.log("error while sending message email ",e.message);
            }
            return sanitizeEntity(entity, { model: strapi.models.autoemail })
        });
        return "ok";
    },
};
