#include "common.h"

static Window *s_window;
static MenuLayer *s_menulayer_1;
static GBitmap *calendar_icon;
static GBitmap *clock_icon;
static GBitmap *entertainment_icon;

// MENU CALLBACKS

static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
  return 1;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  return 3;
}

static int16_t menu_get_header_height_callback(MenuLayer *layer, uint16_t section_index, void *data) {
  return 0;
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
  }
}

// APP MESSAGE CALLBACKS

void out_sent_handler(DictionaryIterator *sent, void *context) {
  // Outgoing message was delivered
}

void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context) {
  // Outgoing message failed
  APP_LOG(APP_LOG_LEVEL_DEBUG, "Failed: %d", reason);
}

void in_received_handler(DictionaryIterator *iter, void *context) {
  // Incoming message received
  Tuple *wait_time_tuple = dict_find(iter, WAIT_TIME);
  Tuple *description_tuple = dict_find(iter, DESCRIPTION);
  Tuple *entertainment_status_tuple = dict_find(iter, ENTERTAINMENT_STATUS);
  Tuple *schedule_time_tuple = dict_find(iter, SCHEDULE_TIME);
  Tuple *type_tuple = dict_find(iter, TYPE);
  Tuple *error_title_tuple = dict_find(iter, ERROR_TITLE);
  Tuple *error_desc_tuple = dict_find(iter, ERROR_DESC);
  if (wait_time_tuple) {
    // Got a wait time
    wait_times_in_received_handler(iter);
  } else if (description_tuple) {
    // Got attraction info
    attraction_info_in_received_handler(iter);
  } else if (entertainment_status_tuple) {
    // Got an entertainment attraction
    entertainment_list_in_received_handler(iter);
  } else if (schedule_time_tuple) {
    // Got an entertainment schedule time
    schedule_in_received_handler(iter);
  } else if (type_tuple) {
    // Got an itinerary item
    itinerary_in_received_handler(iter);
  } else if (error_title_tuple) {
    // Got an error
    show_error(error_title_tuple->value->cstring, error_desc_tuple->value->cstring);
  }
}

void in_dropped_handler(AppMessageResult reason, void *context) {
  // Incoming message was dropped
}

// Initialize all UI components
static void initialise_ui(void) {
  s_window = window_create();
  window_set_fullscreen(s_window, false);
  
  calendar_icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_CALENDAR_ICON);
  clock_icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_CLOCK_ICON);
  entertainment_icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_ENTERTAINMENT_ICON);
  
  // menu_layer
  s_menulayer_1 = menu_layer_create(GRect(0, 0, 144, 152));
  menu_layer_set_callbacks(s_menulayer_1, NULL, (MenuLayerCallbacks) {
    .get_num_sections = menu_get_num_sections_callback,
    .get_num_rows = menu_get_num_rows_callback,
    .get_header_height = menu_get_header_height_callback,
    .draw_row = menu_draw_row_callback,
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
}

// Window unload callback
static void handle_window_unload(Window* window) {
  destroy_ui();
}

// Show window
void show_main_menu(void) {
  app_message_register_inbox_received(in_received_handler);
  app_message_register_inbox_dropped(in_dropped_handler);
  app_message_register_outbox_sent(out_sent_handler);
  app_message_register_outbox_failed(out_failed_handler);
  app_message_open(300, 100);
  
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