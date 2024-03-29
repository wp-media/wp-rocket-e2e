@llcssbg @setup
Feature: C14412 - Should be compatible with Elementor background

    Scenario: Enable LL BG Images and check page template
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'media' 'lazyloadCssBgImg'
        Then I must not see any visual regression 'elementorLlcss'
        When I log out
        Then no error in the console different than nowprocket page 'elementor-overlay'
