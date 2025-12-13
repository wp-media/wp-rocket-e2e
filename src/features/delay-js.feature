@delayjs @setup
Feature: No Regression with delayjs script udpate

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'fileOptimization' 'delayJs'
@test
    Scenario Outline: Shouldn't cause console error when enabling Delay JS with theme
        Given theme "<theme>" is activated
        And one click exclusions are enabled
        When I log out
        Then no error in the console different than nowprocket page ''

        Examples:
            | theme                  |
            | astra                  |
            | Divi                   |
            | flatsome               |
            | storefront             |
            | hello-elementor        |
            | neve                   |
            | kadence                |
            | generatepress          |
            | genesis-sample         |
            | Avada                  |

