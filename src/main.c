/*********
* MyDisneyExperience for Pebble
*
* NOTE: NOT ASSOCIATED WITH THE WALT DISNEY COMPANY, WALT DISNEY WORLD,
* OR DISNEY PARKS IN ANY WAY
*
* Created by: Brian Jett (http://logicalpixels.com)
*/

#include "common.h"

static void init(void) {
  show_main_menu();
}

int main(void) {
    init();
    app_event_loop();
}