@lcp @setup
Feature: Beacon script captures the right images.

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'

    Scenario: Beacon captures expected images in desktop
        When I log out
        And I visit the urls for 'desktop'
        Then lcp and atf should be as expected in 'desktop'

    Scenario: Beacon captures expected images in mobile
        When I log out
        And I visit the urls for 'mobile'
        Then lcp and atf should be as expected in 'mobile'
