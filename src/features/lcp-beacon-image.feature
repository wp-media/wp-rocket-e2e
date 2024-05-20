@lcp @setup
Feature: Fetchpriority should be applied to image

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'

  Scenario: When I visited a page that has LCP with relative image
    When I log out
    #And I go to 'lcp_regular_image_template'
    And lcp image in 'lcp_regular_image_template' has fetchpriority