#include "common.h"

static Window *s_window;
static MenuLayer *s_menulayer_1;
static GBitmap *calendar_icon;
static GBitmap *clock_icon;
static GBitmap *entertainment_icon;
static GBitmap *info_icon;

// MENU CALLBACKS

static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
  return 1;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  return 4;
}

static int16_t menu_get_header_height_callback(MenuLayer *layer, uint16_t section_index, void *data) {
  return 0;
}

static void menu_draw_header_callback(GContext *ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
  //menu_cell_basic_header_draw(ctx, cell_layer, "Disney World");
}

static void menu_draw_row_callback(GContext *ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
  switch (cell_index->row) {
    case 0:
      menu_cell_basic_draw(ctx, cell_layer, "My Itinerary", NULL, calendar_icon);
      break;
    case 1:
      menu_cell_basic_draw(ctx, cell_layer, "Wait Times", NULL, clock_icon);
      break;
    case 2:
      menu_cell_basic_draw(ctx, cell_layer, "Entertainment", NULL, entertainment_icon);
      break;
    case 3:
      menu_cell_basic_draw(ctx, cell_layer, "About", NULL, info_icon);
  }
}

void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  switch (cell_index->row) {
    case 0:
      show_itinerary();
      break;
    case 1:
      show_wait_times_select_park();
      break;
    case 2:
      show_entertainment_select_park();
      break;
    case 3:
      show_about();
      break;
  }
}

// Initialize all UI components
static void initialise_ui(void) {
  s_window = window_create();
  window_set_fullscreen(s_window, false);
  
  calendar_icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_CALENDAR_ICON);
  clock_icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_CLOCK_ICON);
  entertainment_icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_ENTERTAINMENT_ICON);
  info_icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_INFO_ICON);
  
  // menu_layer
  s_menulayer_1 = menu_layer_create(GRect(0, 0, 144, 152));
  menu_layer_set_callbacks(s_menulayer_1, NULL, (MenuLayerCallbacks) {
    .get_num_sections = menu_get_num_sections_callback,
    .get_num_rows = menu_get_num_rows_callback,
    .get_header_height = menu_get_header_height_callback,
    .draw_row = menu_draw_row_callback,
    .draw_header = menu_draw_header_callback,
    .select_click = menu_select_callback
  });
  menu_layer_set_click_config_onto_window(s_menulayer_1, s_window);
  layer_add_child(window_get_root_layer(s_window), (Layer *)s_menulayer_1);
}

// Free all memory form UI components
static void destroy_ui(void) {
  window_destroy(s_window);
  menu_layer_destroy(s_menulayer_1);
  gbitmap_destroy(calendar_icon);
  gbitmap_destroy(clock_icon);
  gbitmap_destroy(entertainment_icon);
  gbitmap_destroy(info_icon);
}

// Window unload callback
static void handle_window_unload(Window* window) {
  destroy_ui();
}

// Show window
void show_main_menu(void) {
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

// Hide window
void hide_main_menu(void) {
  window_stack_remove(s_window, true);
}