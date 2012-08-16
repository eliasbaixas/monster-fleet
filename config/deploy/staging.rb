require 'bundler'
ENV["BUNDLE_GEMFILE"] = File.expand_path("../../../Gemfile", __FILE__)
Bundler.setup
require 'bundler/capistrano'

load 'deploy'

default_environment["PATH"] = "/opt/ruby-enterprise-1.8.7-2010.02/bin/:#{ENV['PATH']}"

default_run_options[:pty] = true
set :application, "musicmap"
set :local_repository, "gitosis@gitosis:music_map.git"
set :repository, "file:///srv/gitosis/repositories/music_map.git"
set :keep_releases, 3
set :rails_env, "production"
set :scm, :git
set :host, "music.map"
set :scm_username, "www-music"
set :deploy_root, "/home/www-music"
set :deploy_to, "/home/www-music/#{application}"
set :deploy_via, :remote_cache
set :repository_cache, "music_map_cache"
set :git_enable_submodules, 1
#set :use_sudo, true
# deploy:start, deploy:stop and deploy:restart runner
set :runner, "www-music"
# deploy:setup and deploy:cleanup runner (admin)
# if unset, they run as root
# if you want it to be runner, set :admin_runner to runner
set :admin_runner, "www-music"

set :jail_user, "www-music"
set :jail_group, "www-music"

#server "94.23.238.195", :app, :web, :db, :primary => true
role :app, "music.map"
role :web, "music.map"
role :db, "music.map", :primary => true


desc "Change ownership of specific directories to jail_user"
task :chown_app, :roles => :app do
  sudo <<-CMD
  sh -c "chown -R #{jail_user}:#{jail_group} #{release_path} &&
         chmod -R g+w #{release_path}"
  CMD
end

desc "Set the proper permissions for directories and files. Specify a list of folders and files with `set :chmod755` in config/deploy.rb"
task :set_perms, :roles => [:app, :db, :web] do
  run(chmod755.collect { |i| "chmod 755 #{current_path}/#{i}" }.join(" && "))
end

desc "Returns last lines of log file. Usage: cap log [-s lines=100] [-s rails_env=production]"  
task :log do
  lines     = variables[:lines] || 100
  rails_env = variables[:rails_env] || 'production'  
  run "tail -n #{lines} #{shared_path}/log/#{rails_env}.log" do |ch, stream, out|  
    puts out  
  end
end

desc "Remote console on the production appserver"
task :console, :roles => :app do
  input = ''
  run "cd #{current_path} && ./script/console production" do
    |channel, stream, data|
    next if data.chomp == input.chomp || data.chomp == ''
    print data
    channel.send_data(input = $stdin.gets) if data =~ /^(>|\?)>/
  end
end

namespace :deploy do
  task :symlink_data_dir do
    puts 'Linking public/data directory...'
    run "ln -nfs #{shared_path}/system/matteo #{release_path}/public/data"
  end
  task :symlink_files_dir do
    puts 'Linking public/files directory...'
    run "ln -nfs #{shared_path}/files #{release_path}/public/files"
  end
  task :create_files_dir do
    run "mkdir -p #{shared_path}/files"
  end
  after "setup", "deploy:create_files_dir"
# after "deploy:update_code" , "deploy_rails"
# after "deploy:update_code" , "chown_app"
  after "deploy", "deploy:symlink_files_dir"
  after "deploy", "deploy:symlink_data_dir"
end

namespace :deploy do
  task :start, :roles => :app do
    run "touch #{current_release}/tmp/restart.txt"
  end

  task :stop, :roles => :app do
  end

  desc "Restart Application"
  task :restart, :roles => :app do
    run "touch #{current_release}/tmp/restart.txt"
  end
end
