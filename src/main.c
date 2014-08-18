/*********
* MyDisneyExperience for Pebble
*
* NOTE: NOT ASSOCIATED WITH THE WALT DISNEY COMPANY, WALT DISNEY WORLD,
* OR DISNEY PARKS IN ANY WAY
*
* Created by: Brian Jett (http://logicalpixels.com)
*/

#include "common.h"
  
static int failed_attempts;
static AppTimer *resend_timer;
  
void resend_timer_callback(void *data) {
  
}

// APP MESSAGE CALLBACKS

char *translate_error(AppMessageResult result) {
  switch (result) {
    case APP_MSG_OK: return "APP_MSG_OK";
    case APP_MSG_SEND_TIMEOUT: return "APP_MSG_SEND_TIMEOUT";
    case APP_MSG_SEND_REJECTED: return "APP_MSG_SEND_REJECTED";
    case APP_MSG_NOT_CONNECTED: return "APP_MSG_NOT_CONNECTED";
    case APP_MSG_APP_NOT_RUNNING: return "APP_MSG_APP_NOT_RUNNING";
    case APP_MSG_INVALID_ARGS: return "APP_MSG_INVALID_ARGS";
    case APP_MSG_BUSY: return "APP_MSG_BUSY";
    case APP_MSG_BUFFER_OVERFLOW: return "APP_MSG_BUFFER_OVERFLOW";
    case APP_MSG_ALREADY_RELEASED: return "APP_MSG_ALREADY_RELEASED";
    case APP_MSG_CALLBACK_ALREADY_REGISTERED: return "APP_MSG_CALLBACK_ALREADY_REGISTERED";
    case APP_MSG_CALLBACK_NOT_REGISTERED: return "APP_MSG_CALLBACK_NOT_REGISTERED";
    case APP_MSG_OUT_OF_MEMORY: return "APP_MSG_OUT_OF_MEMORY";
    case APP_MSG_CLOSED: return "APP_MSG_CLOSED";
    case APP_MSG_INTERNAL_ERROR: return "APP_MSG_INTERNAL_ERROR";
    default: return "UNKNOWN ERROR";
  }
}

void out_sent_handler(DictionaryIterator *sent, void *context) {
  // Outgoing message was delivered
  APP_LOG(APP_LOG_LEVEL_DEBUG, "Outgoing message was delivered");
  failed_attempts = 0;
}

void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context) {
  // Outgoing message failed
  APP_LOG(APP_LOG_LEVEL_DEBUG, "Outgoing message failed with reason: %s", translate_error(reason));
  //show_error("Failed Sending", translate_error(reason));
  failed_attempts++;
  if ((reason == APP_MSG_SEND_TIMEOUT || reason == APP_MSG_BUSY || reason == APP_MSG_NOT_CONNECTED) && failed_attempts <= 5) {
    DictionaryIterator *iter;
    app_message_outbox_begin(&iter);
    
    if (iter == NULL) {
      return;
    }
    
    Tuple *tuple = dict_read_first(failed);
    
    while (tuple) {
      switch (tuple->type) {
        case TUPLE_CSTRING:
          dict_write_cstring(iter, tuple->key, tuple->value->cstring);
          break;
        case TUPLE_INT:
          dict_write_int16(iter, tuple->key, tuple->value->int16);
          break;
        default:
          break;
      }
      tuple = dict_read_next(failed);
    }
    
    app_message_outbox_send();
  } else {
    show_error("Error:", translate_error(reason));
    failed_attempts = 0;
  }
}

void in_received_handler(DictionaryIterator *iter, void *context) {
  // Incoming message received
  //APP_LOG(APP_LOG_LEVEL_DEBUG, "Incoming message received");
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
  APP_LOG(APP_LOG_LEVEL_DEBUG, "Incoming message was dropped");
  //show_error("Failed Receiving", translate_error(reason));
}

static void init(void) {
  app_comm_set_sniff_interval(SNIFF_INTERVAL_REDUCED);
  
  failed_attempts = 0;
  
  app_message_register_inbox_received(in_received_handler);
  app_message_register_inbox_dropped(in_dropped_handler);
  app_message_register_outbox_sent(out_sent_handler);
  app_message_register_outbox_failed(out_failed_handler);
  app_message_open(300, 200);
  
  show_main_menu();
}

int main(void) {
    init();
    app_event_loop();
  app_comm_set_sniff_interval(SNIFF_INTERVAL_NORMAL);
}