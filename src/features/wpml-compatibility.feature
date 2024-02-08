@wpml @setup
Feature: C14655 - Should LL Background work on main/sub language
    Background:
      Given I am logged in
      And plugin is installed 'new_release'
      And plugin is activated
      When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
      And I save settings 'media' 'lazyloadCssBgImg'

    Scenario: Check multiple languages are set for wpml directory check
      Given I am logged in
      #Given activate 'wpml-multilingual-cms' plugin
      Given wpml has more than one languages
      #And I save wpml language settings
      Given wpml directory is enabled

    Scenario: Open the page template and compare to nowprocket
      Then no error in the console different than nowprocket page 'llcss'
      Then switch to another language
      #Then I must not see any error in debug.log
      #When I log out

