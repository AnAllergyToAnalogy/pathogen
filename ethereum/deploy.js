const do_deploy = require("./do_deploy.js");

const deployAndLink = async () => {
    await do_deploy.deployAndLinkContracts();
    process.exit(0);
}

deployAndLink();