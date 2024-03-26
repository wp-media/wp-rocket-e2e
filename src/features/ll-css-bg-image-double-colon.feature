@llcssbg @setup
Feature: C14626 - Should lazyload CSS background images inside internal, and external CSS - Double colon
    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'media' 'lazyloadCssBgImg'

    Scenario: Open the page template and compare to nowprocket
        Then I must not see any visual regression 'llcssDoubleColon'
        Then I must not see any error in debug.log
        When I log out
        Then no error in the console different than nowprocket page 'll_bg_css_double_colon'

    Scenario: Inspect the element that loads the background image
        When I log out
        And I go to 'll_bg_css_double_colon'
        Then I must see the correct style in the head
