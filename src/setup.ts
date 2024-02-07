/**===================================== Database  Setup  ===================================== **/
import dbInit from "./database/init";

const setup = async () => {
  await dbInit();
};

setup();
