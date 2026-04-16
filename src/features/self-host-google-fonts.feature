@smoke @selfhostgooglefonts @setup @requires-clean-imagify

Feature: Google Fonts are self-hosted

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'media' 'selfHostGoogleFonts'

    Scenario: Should apply host Google Fonts locally for v1 and v2
        Given I log out
        And I visit the urls and check for self-hosted google fonts
        Then hosted Google Fonts parameters should match expected for all enabled entries
