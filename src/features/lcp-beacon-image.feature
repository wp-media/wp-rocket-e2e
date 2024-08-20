@lcp @setup
Feature: Fetchpriority should be applied to image

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    And I log out
@test
  Scenario: Should add fetchpriority to lcp image
    Given I visit page 'lcp_regular_image_template' with browser dimension 1600 x 700
    When I am logged in
    And I clear cache
    And I log out
    Then I visit page 'lcp_regular_image_template' with browser dimension 1600 x 700
    And lcp image should have fetchpriority