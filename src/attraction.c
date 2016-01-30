#include "common.h"

static Window *s_window;
static GFont s_res_gothic_24_bold;
static GFont s_res_gothic_18_bold;
static GFont s_res_gothic_14;
static TextLayer *name_text_layer;
static TextLayer *location_text_layer;
static TextLayer *description_text_layer;
static char *attraction_id;
static TextLayer *text_layer;
static BitmapLayer *loading_icon_layer;

// Show loading screen
static void show_loading_icon(void) {
  Layer *window_layer = window_get_root_layer(s_window);

  GRect bounds = layer_get_frame(window_layer);

  loading_icon_layer = bitmap_layer_create(GRect(0, 0, bounds.size.w, bounds.size.h));
  bitmap_layer_set_background_color(loading_icon_layer, GColorBlack);
  layer_add_child(window_layer, bitmap_layer_get_layer(loading_icon_layer));

  text_layer = text_layer_create(GRect(0, 60, bounds.size.w, 30));
  text_layer_set_text_alignment(text_layer, GTextAlignmentCenter);
  text_layer_set_overflow_mode(text_layer, GTextOverflowModeWordWrap);
  text_layer_set_font(text_layer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  text_layer_set_background_color(text_layer, GColorBlack);
  text_layer_set_text_color(text_layer, GColorWhite);
  text_layer_set_text(text_layer, "Loading...");
  layer_add_child(window_layer, text_layer_get_layer(text_layer));
}

// Hide loading screen
static void hide_loading_icon(void) {
  layer_remove_from_parent(text_layer_get_layer(text_layer));
  layer_remove_from_parent(bitmap_layer_get_layer(loading_icon_layer));
}

// Cancel all queued incoming messages
static void cancel_app_messages() {
	DictionaryIterator *iter;
	app_message_outbox_begin(&iter);

	if (iter == NULL) {
		return;
	}

  dict_write_int16(iter, CANCEL_MESSAGES, 1);
  app_message_outbox_send();
}

// Get the attraction information for a specific attraction ID
static void get_attraction_info(char *id) {
  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);
  
  if (iter == NULL) {
    return;
  }
  
  dict_write_cstring(iter, GET_ATTRACTION_INFO, id);
  app_message_outbox_send();
}

// App message in received handler
void attraction_info_in_received_handler(DictionaryIterator *iter) {
  Tuple *name_tuple = dict_find(iter, NAME);
  Tuple *location_tuple = dict_find(iter, LOCATION);
  Tuple *description_tuple = dict_find(iter, DESCRIPTION);
  if (name_tuple && location_tuple && description_tuple) {
    text_layer_set_text(name_text_layer, name_tuple->value->cstring);
    text_layer_set_text(location_text_layer, location_tuple->value->cstring);
    text_layer_set_text(description_text_layer, description_tuple->value->cstring);
    hide_loading_icon();
  }
}

// Initialize all UI components
static void initialise_ui(void) {
  s_window = window_create();
  window_set_fullscreen(s_window, 0);
  
  // fonts
  s_res_gothic_24_bold = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);
  s_res_gothic_18_bold = fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD);
  s_res_gothic_14 = fonts_get_system_font(FONT_KEY_GOTHIC_14);
  
  // name_text_layer
  name_text_layer = text_layer_create(GRect(5, 0, 137, 53));
  text_layer_set_font(name_text_layer, s_res_gothic_24_bold);
  text_layer_set_overflow_mode(name_text_layer, GTextOverflowModeTrailingEllipsis);
  layer_add_child(window_get_root_layer(s_window), (Layer *)name_text_layer);
  
  // location_text_layer
  location_text_layer = text_layer_create(GRect(5, 53, 134, 20));
  text_layer_set_font(location_text_layer, s_res_gothic_18_bold);
  text_layer_set_overflow_mode(location_text_layer, GTextOverflowModeTrailingEllipsis);
  layer_add_child(window_get_root_layer(s_window), (Layer *)location_text_layer);
  
  // description_text_layer
  description_text_layer = text_layer_create(GRect(5, 75, 134, 75));
  text_layer_set_font(description_text_layer, s_res_gothic_14);
  text_layer_set_overflow_mode(description_text_layer, GTextOverflowModeTrailingEllipsis);
  layer_add_child(window_get_root_layer(s_window), (Layer *)description_text_layer);
  
  get_attraction_info(attraction_id);
  
  show_loading_icon();
}

// Free all memory used by UI components
static void destroy_ui(void) {
  window_destroy(s_window);
  text_layer_destroy(name_text_layer);
  text_layer_destroy(location_text_layer);
  text_layer_destroy(description_text_layer);
  text_layer_destroy(text_layer);
  bitmap_layer_destroy(loading_icon_layer);
}

// Window unload callback
static void handle_window_unload(Window* window) {
  cancel_app_messages();
  destroy_ui();
}

// Push window on to stack
void show_attraction_info(char *id) {
  attraction_id = id;
  
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

// Remove window from stack
void hide_attraction_info(void) {
  window_stack_remove(s_window, true);
}