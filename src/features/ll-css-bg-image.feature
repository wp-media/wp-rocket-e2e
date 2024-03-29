@llcssbg @setup
Feature: C13969 - Should lazyload CSS background images inside internal, and external CSS
    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'media' 'lazyloadCssBgImg'

    Scenario: Open the page template and compare to nowprocket
        Then I must not see any visual regression 'llcss'
        Then I must not see any error in debug.log
        When I log out
        Then no error in the console different than nowprocket page 'lazyload_css_background_images'

    Scenario: Inspect the element that loads the background image
        When I log out
        And I go to 'lazyload_css_background_images'
        Then I must see the correct style in the head
