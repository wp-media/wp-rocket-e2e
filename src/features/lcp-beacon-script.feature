@lcp @setup
Feature: Beacon script captures the right images.

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And plugin 'sitepress-multilingual-cms' is deactivated

    Scenario: Beacon captures expected images in desktop
        When I log out
        And I visit the urls for 'desktop'

    Scenario: Beacon captures expected images in mobile
        Given I install plugin 'https://github.com/wp-media/wp-rocket-e2e-test-helper/blob/main/helper-plugin/force-wp-mobile.zip'
        And plugin 'force-wp-mobile' is activated
        When I log out
        And I visit the urls for 'mobile'
