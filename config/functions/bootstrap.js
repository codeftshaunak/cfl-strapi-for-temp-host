"use strict";

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

// const faker = require("faker");
// const _ = require("lodash");

module.exports = async () => {
  // generate fake users and profiles
  // const _PRONOUNS = ["He/Him", "She/Her", "They/Them"];
  // const _ROLES = ["Founder", "Advisor", "Intern", "Investor"];
  // const _LOOKINGFOR = [
  //   "Team Member",
  //   "CoFounder",
  //   "Investor",
  //   "Advisor",
  //   "Intern",
  // ];
  // const _STARTUPSTAGE = [
  //   "Concept and Research",
  //   "Traction",
  //   "Launch",
  //   "Pre-revenue",
  //   "Early",
  //   "Growth",
  //   "Scale",
  //   "Exit",
  // ];
  // const _SKILLS = [
  //   "Analysis",
  //   "Finance",
  //   "Fundraising",
  //   "Leadership",
  //   "Graphics / Design",
  //   "Marketing / Communications",
  //   "Business Planning / Processes / Systems",
  //   "Corporate Strategy",
  //   "Human Resources",
  //   "Operations",
  //   "Team Building",
  //   "Accessibility",
  //   "Account Management",
  //   "Accounting",
  //   "Adobe Creative Suite",
  //   "Advertising",
  //   "After Effects",
  //   "Analysis",
  //   "Analytics",
  //   "Animation",
  //   "Art Direction",
  //   "Branding & Identity",
  //   "Building Strong Relationships",
  //   "Business Analysis",
  //   "Business Development",
  //   "Business Intelligence",
  //   "Business Networking",
  //   "Business Planning",
  //   "Business Process",
  //   "Business Strategy",
  //   "Capital Markets",
  //   "Change Management",
  //   "Design",
  //   "Finance ",
  //   "Fundraising ",
  //   "Interest",
  //   "Leadership",
  //   "Management ",
  //   "Management ",
  //   "Marketing",
  //   "Operations ",
  //   "Product ",
  //   "Programming",
  //   "Public Relations",
  //   "Recruiting",
  //   "Sales Strategy ",
  //   "Technical",
  //   "User Experience",
  //   "Java Developer",
  //   "PHP Developer",
  //   "JavaScript Devloper",
  //   "iOS Developer",
  //   "QA Enginerers",
  //   "Data Scientist",
  //   "Infrastructure Engineers",
  //   "UI/UX Designer",
  //   "Graphic Designer",
  //   "Art Directors",
  //   "Web Designer",
  //   "Motion Desiger",
  //   "Animator ",
  //   "Video Editor",
  //   "Photo Editor",
  //   "SEM Specialists ",
  //   "SEO Specialists",
  //   "Social Media Manager",
  //   "Paid Media Expert",
  //   "Email Marketer ",
  //   "Marketing Analysts",
  //   "Market Researcher",
  //   "Sales Representatives ",
  //   "Copywriter",
  //   "Project Management ",
  //   "Accounting ",
  //   "Bookkeeper",
  //   "3D Modeler",
  //   "Architectural Designer ",
  //   "Mechanical Engineer",
  //   "Civil Engineer ",
  //   "Eletrical Engineer",
  //   "Chemical Engineer",
  //   "Industrail Designer",
  //   "Communities",
  //   "web3",
  //   "Crypto",
  //   "NFT",
  // ];
  // const _INTERESTS = ["Education", "Mentorship", "Networking", "Investment"];
  // const _PROFILEPICTURES = [
  //   "617b75d31047eb39f731a07a",
  //   "617b75d31047eb39f731a079",
  //   "617b75ce1047eb39f731a078",
  //   "617b75ce1047eb39f731a077",
  //   "617b75ce1047eb39f731a076",
  //   "617b75ce1047eb39f731a075",
  //   "617b75ce1047eb39f731a074",
  //   "617b75cd1047eb39f731a073",
  // ];
  // for (let index = 0; index < 24; index++) {
  //   const email = faker.internet.email().toLowerCase();
  //   const user = await strapi.query("user", "users-permissions").create({
  //     username: email,
  //     email: email,
  //     phone: faker.phone.phoneNumberFormat(),
  //     confirmed: true,
  //     onboarded: true,
  //     onboardedAt: new Date(),
  //     role: "616dc08eddd40a6af489ec09",
  //   });
  //   const profile = await strapi.services.profile.create({
  //     user: user.id,
  //     firstName: faker.name.firstName(),
  //     lastName: faker.name.lastName(),
  //     tagline: faker.name.jobTitle(),
  //     summary: faker.lorem.paragraphs(),
  //     pronouns: _.sample(_PRONOUNS),
  //     role: _.sample(_ROLES),
  //     lookingFor: _.sample(_LOOKINGFOR),
  //     startupStage: _.sample(_STARTUPSTAGE),
  //     skills: _.sampleSize(_SKILLS, _.random(1, 5)),
  //     interests: _.sampleSize(_INTERESTS, _.random(1, 4)),
  //     profilePicture: _.sample(_PROFILEPICTURES),
  //     city: "56cc14c588b042411c0bd010",
  //   });
  // }
};
