Feature: Should roll back to the last previous major version when using the roll back functionality

    Background:
        Given I am logged in
        And plugin is installed
        And plugin is activated

    Scenario: WP Rocket is installed but not activated
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I click on '#wpr-nav-tools'
        And I click on '.wpr-tools:nth-child(4) a'
        Then I should see 'Plugin updated successfully.'
        Then rollback version must be the same as in the button
        But no error in debug.log