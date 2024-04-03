@wpml @setup
Feature: C14655 - Should LL Background work on main/sub language
    Background:
      Given I am logged in
      And plugin is installed 'new_release'
      And plugin is activated
      When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
      And I save settings 'media' 'lazyloadCssBgImg'
      When I go to 'wp-admin/plugins.php'
      And activate 'wpml-multilingual-cms' plugin
      And wpml has more than one languages
      And wpml directory is enabled

    Scenario: Open the page with directory lanaguage
      Then no error in the console different than nowprocket page 'llcss'
      When switch to another language
      Then I must not see any error in debug.log

    Scenario: Change WPML to query string option
      Given wpml query string is enabled
      Then no error in the console different than nowprocket page 'llcss'
      When switch to another language
      Then I must not see any error in debug.log